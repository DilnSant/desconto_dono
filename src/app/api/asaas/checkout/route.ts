import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  createAsaasCustomer,
  findAsaasCustomerByExternalRef,
  createAsaasCheckout,
  getAsaasCheckoutUrl,
  AsaasApiError,
} from '@/lib/asaas/client'
import { getCheckoutCallbackUrls } from '@/lib/asaas/callback-urls'
import type { AsaasCreateCheckoutResponse } from '@/lib/asaas/types'
import { getPlanMonthlyPriceCents, type PlanType } from '@/lib/plans/entitlements'

const ALLOWED_PLANS: PlanType[] = ['Essencial', 'Profissional']

function nextDueDate(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

export async function POST(request: Request) {
  const sessionClient = await createSupabaseServerClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 })

  // 1. Ler e validar body
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const { planType, profileId } = (body ?? {}) as Record<string, unknown>

  if (typeof planType !== 'string' || !ALLOWED_PLANS.includes(planType as PlanType)) {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
  }
  if (typeof profileId !== 'string' || profileId !== user.id) {
    return NextResponse.json({ error: 'Perfil inválido.' }, { status: 403 })
  }

  const plan = planType as PlanType
  let callback: ReturnType<typeof getCheckoutCallbackUrls>
  try {
    callback = getCheckoutCallbackUrls(
      request.url,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.VERCEL_URL,
    )
  } catch {
    return NextResponse.json({ error: 'Checkout temporariamente indisponível. Configure a URL pública do aplicativo.' }, { status: 503 })
  }

  let stage = 'create-admin-client'

  try {
    const supabase = createSupabaseAdminClient()

    // 2. Buscar perfil do usuário no Supabase
    stage = 'load-profile'
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan_type')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
    }

    // 3. Verificar se já tem assinatura ativa
    stage = 'check-existing-subscription'
    const { data: existingSub, error: existingSubError } = await supabase
      .from('subscriptions')
      .select('id, status, plan_type')
      .eq('profile_id', profileId)
      .in('status', ['PENDING', 'ACTIVE', 'PAST_DUE'])
      .maybeSingle()

    if (existingSubError) {
      console.error('[CHECKOUT] Não foi possível consultar a assinatura existente:', existingSubError.message)
      return NextResponse.json({ error: 'Não foi possível validar sua assinatura agora.' }, { status: 503 })
    }

    if (existingSub) {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura ativa. Gerencie pelo painel.' },
        { status: 409 }
      )
    }

    // 4. Obter ou criar Customer no Asaas
    const customerExternalRef = `profile:${profileId}`
    stage = 'find-asaas-customer'
    let asaasCustomer = await findAsaasCustomerByExternalRef(customerExternalRef)

    if (!asaasCustomer) {
      stage = 'create-asaas-customer'
      asaasCustomer = await createAsaasCustomer({
        name: profile.full_name ?? 'Cliente Desconto do Dono',
        email: profile.email ?? '',
        externalReference: customerExternalRef,
      })
    }

    // 5. Criar referência externa única para a assinatura
    const externalReference = `sub:${profileId}:${plan}:${Date.now()}`
    const planTypeForDb = plan as 'Essencial' | 'Profissional'
    stage = 'reserve-subscription'
    const { data: pendingSubscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        profile_id: profileId,
        plan_type: planTypeForDb,
        asaas_customer_id: asaasCustomer.id,
        external_reference: externalReference,
        billing_type: null,
        status: 'PENDING',
      })
      .select('id')
      .single()

    if (insertError || !pendingSubscription) {
      console.error('[CHECKOUT] Erro ao reservar assinatura pendente:', insertError?.message)
      return NextResponse.json({ error: 'Não foi possível iniciar a assinatura.' }, { status: 409 })
    }

    // 6. Criar checkout recorrente hospedado no Asaas
    const priceCents = getPlanMonthlyPriceCents(plan)
    let checkout: AsaasCreateCheckoutResponse
    stage = 'create-asaas-checkout'
    try {
      checkout = await createAsaasCheckout({
        customer: asaasCustomer.id,
        billingTypes: ['CREDIT_CARD'],
        chargeTypes: ['RECURRENT'],
        minutesToExpire: 1440,
        externalReference,
        callback,
        items: [{ name: `Plano ${plan} — Desconto do Dono`, quantity: 1, value: priceCents / 100 }],
        subscription: { cycle: 'MONTHLY', nextDueDate: nextDueDate() },
      })
    } catch (checkoutError) {
      await supabase.from('subscriptions')
        .update({ status: 'FAILED' })
        .eq('id', pendingSubscription.id)
      throw checkoutError
    }

    stage = 'associate-asaas-checkout'
    const { error: checkoutLinkError } = await supabase
      .from('subscriptions')
      .update({ asaas_checkout_id: checkout.id })
      .eq('id', pendingSubscription.id)
    if (checkoutLinkError) {
      console.error('[CHECKOUT] Erro ao associar checkout à assinatura:', checkoutLinkError.message)
      return NextResponse.json({ error: 'Checkout criado, mas não foi possível finalizar a assinatura.' }, { status: 503 })
    }

    // 8. Obter link de pagamento
    return NextResponse.json({ paymentLink: getAsaasCheckoutUrl(checkout.id) }, { status: 201 })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      console.error('[CHECKOUT] Erro do provedor:', { stage, status: err.status, codes: err.codes })
    } else {
      console.error('[CHECKOUT] Erro inesperado:', { stage, errorName: err instanceof Error ? err.name : 'UnknownError' })
    }
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
