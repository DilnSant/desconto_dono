import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
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
  if (!expectedToken?.trim()) {
    console.warn('[WEBHOOK] ASAAS_WEBHOOK_TOKEN não configurado — aceitando sem validação')
    return true
  }
  const receivedToken =
    request.headers.get('asaas-access-token') ??
    request.headers.get('access_token') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  return receivedToken === expectedToken
}

function buildEventKey(payload: AsaasWebhookPayload): string {
  const resourceId =
    payload.payment?.id ??
    payload.subscription?.id ??
    'unknown'
  return `${payload.event}:${resourceId}`
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

  const eventType = payload.event?.toUpperCase()

  // 3. Ignorar eventos que não precisamos tratar
  if (!HANDLED_EVENTS.has(eventType)) {
    return NextResponse.json({ received: true, processed: false, reason: 'event_ignored' })
  }

  const payment = payload.payment
  const subscription = payload.subscription

  const asaasSubscriptionId = payment?.subscription ?? subscription?.id ?? null
  const asaasCustomerId = payment?.customer ?? subscription?.customer ?? null
  const externalReference =
    payment?.externalReference ?? subscription?.externalReference ?? null
  const checkoutSessionId = payment?.checkoutSession ?? null
  const billingType = payment?.billingType ?? subscription?.billingType ?? null
  const providerStatus = subscription?.status ?? null

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
  const resourceId = payment?.id ?? subscription?.id ?? null

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
