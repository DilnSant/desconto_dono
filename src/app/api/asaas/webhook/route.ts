import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getAsaasCheckout, getAsaasPayment, getAsaasSubscription } from '@/lib/asaas/client'
import type { AsaasWebhookPayload } from '@/lib/asaas/types'

// Eventos que ativam o plano
const ACTIVATE_EVENTS = new Set([
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'CHECKOUT_PAID',
])

// Eventos que cancelam/encerram o plano
const DEACTIVATE_EVENTS = new Set([
  'SUBSCRIPTION_DELETED',
  'SUBSCRIPTION_CANCELED',
  'SUBSCRIPTION_INACTIVATED',
])

// Todos os eventos que processamos
const HANDLED_EVENTS = new Set([
  ...ACTIVATE_EVENTS,
  ...DEACTIVATE_EVENTS,
  'PAYMENT_OVERDUE',
  'SUBSCRIPTION_CREATED',
])

function verifyWebhookToken(request: Request): boolean {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN
  if (!expectedToken?.trim()) return false
  const receivedToken =
    request.headers.get('asaas-access-token') ??
    request.headers.get('access_token') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!receivedToken) return false
  const expected = Buffer.from(expectedToken)
  const received = Buffer.from(receivedToken)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

function buildEventKey(payload: AsaasWebhookPayload): string {
  const resourceId =
    payload.checkout?.id ??
    payload.payment?.id ??
    payload.subscription?.id ??
    'unknown'
  return payload.id ?? `${payload.event}:${resourceId}`
}

export async function POST(request: Request) {
  // 1. Validar token
  if (!verifyWebhookToken(request)) {
    console.warn('[WEBHOOK] Token inválido — rejeitando requisição')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Ler payload
  let payload: AsaasWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object' || typeof payload.event !== 'string') {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const eventType = payload.event?.toUpperCase()

  // 3. Ignorar eventos que não precisamos tratar
  if (!HANDLED_EVENTS.has(eventType)) {
    return NextResponse.json({ received: true, processed: false, reason: 'event_ignored' })
  }

  if (eventType === 'CHECKOUT_PAID') {
    if (!payload.checkout?.id) {
      return NextResponse.json({ error: 'Checkout inválido.' }, { status: 400 })
    }
    try {
      const checkout = await getAsaasCheckout(payload.checkout.id)
      if (checkout.status !== 'PAID') {
        return NextResponse.json({ received: true, processed: false, reason: 'checkout_not_paid' })
      }
      if (payload.checkout.externalReference && checkout.externalReference !== payload.checkout.externalReference) {
        return NextResponse.json({ error: 'Referência do checkout inválida.' }, { status: 400 })
      }
      payload.checkout = checkout
    } catch {
      return NextResponse.json({ error: 'Não foi possível validar o checkout.' }, { status: 503 })
    }
  }

  if (eventType.startsWith('PAYMENT_')) {
    if (!payload.payment?.id) return NextResponse.json({ error: 'Pagamento inválido.' }, { status: 400 })
    try {
      const payment = await getAsaasPayment(payload.payment.id)
      const isPaid = payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'
      if (eventType === 'PAYMENT_OVERDUE' && payment.status !== 'OVERDUE') {
        return NextResponse.json({ received: true, processed: false, reason: 'payment_not_overdue' })
      }
      if ((eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED') && !isPaid) {
        return NextResponse.json({ received: true, processed: false, reason: 'payment_not_confirmed' })
      }
      if (payload.payment.subscription && payment.subscription !== payload.payment.subscription) {
        return NextResponse.json({ error: 'Assinatura do pagamento inválida.' }, { status: 400 })
      }
      payload.payment = { ...payload.payment, ...payment }
    } catch {
      return NextResponse.json({ error: 'Não foi possível validar o pagamento.' }, { status: 503 })
    }
  }

  if (eventType.startsWith('SUBSCRIPTION_')) {
    if (!payload.subscription?.id) return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 })
    try {
      const subscription = await getAsaasSubscription(payload.subscription.id)
      if (
        (payload.subscription.customer && subscription.customer !== payload.subscription.customer)
        || (payload.subscription.externalReference && subscription.externalReference !== payload.subscription.externalReference)
      ) {
        return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 })
      }
      payload.subscription = { ...payload.subscription, ...subscription }
    } catch {
      return NextResponse.json({ error: 'Não foi possível validar a assinatura.' }, { status: 503 })
    }
  }

  const payment = payload.payment
  const subscription = payload.subscription

  const asaasSubscriptionId = payment?.subscription ?? subscription?.id ?? null
  const asaasCustomerId = payment?.customer ?? subscription?.customer ?? null
  const externalReference =
    payment?.externalReference ?? subscription?.externalReference ?? null
  const checkoutSessionId = payload.checkout?.id ?? payment?.checkoutSession ?? null
  const billingType = payment?.billingType ?? subscription?.billingType ?? null
  const providerStatus = subscription?.status ?? payload.checkout?.status ?? payment?.status ?? null

  // Calcular data de fim do período (próximo vencimento ou +1 mês)
  let periodEnd: string | null = null
  if (payment?.paymentDate ?? payment?.confirmedDate) {
    const base = new Date(
      (payment?.confirmedDate ?? payment?.paymentDate)!
    )
    base.setMonth(base.getMonth() + 1)
    periodEnd = base.toISOString()
  } else if (subscription?.nextDueDate) {
    periodEnd = new Date(subscription.nextDueDate).toISOString()
  }

  const eventAt = new Date().toISOString()
  const eventKey = buildEventKey(payload)
  const resourceId = payload.checkout?.id ?? payment?.id ?? subscription?.id ?? null

  try {
    const supabase = createSupabaseAdminClient()

    // 4. Chamar a função do banco que aplica o evento de forma idempotente
    const { data, error } = await supabase.rpc('apply_asaas_subscription_event', {
      p_event_key: eventKey,
      p_event_type: eventType,
      p_resource_id: resourceId,
      p_checkout_id: checkoutSessionId,
      p_asaas_subscription_id: asaasSubscriptionId,
      p_external_reference: externalReference,
      p_asaas_customer_id: asaasCustomerId,
      p_billing_type: billingType,
      p_provider_status: providerStatus,
      p_period_end: periodEnd,
      p_event_at: eventAt,
    })

    if (error) {
      console.error('[WEBHOOK] Erro ao aplicar evento:', error.message)
      // Retornar 200 para o Asaas não reenviar em caso de erro esperado
      // (ex: assinatura não encontrada — pode ser de outro ambiente)
      if (error.message.includes('No pending subscription')) {
        return NextResponse.json({ received: true, processed: false, reason: 'no_subscription' })
      }
      return NextResponse.json({ error: 'Erro ao processar evento.' }, { status: 500 })
    }

    const result = Array.isArray(data) ? data[0] : data
    const isDuplicate = result?.duplicate ?? false
    const wasApplied = result?.applied ?? false

    console.info(
      `[WEBHOOK] ${eventType} | key=${eventKey} | duplicate=${isDuplicate} | applied=${wasApplied}`
    )

    return NextResponse.json({ received: true, processed: wasApplied, duplicate: isDuplicate })
  } catch (err) {
    console.error('[WEBHOOK] Erro inesperado:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
