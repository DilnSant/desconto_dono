import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  createAsaasCustomer,
  findAsaasCustomerByExternalRef,
  createAsaasSubscription,
  getSubscriptionPaymentLink,
} from '@/lib/asaas/client'
import { getPlanMonthlyPriceCents, type PlanType } from '@/lib/plans/entitlements'

const ALLOWED_PLANS: PlanType[] = ['Essencial', 'Profissional']

function nextIsoDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function POST(request: Request) {
  // 1. Ler e validar body
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const { planType, profileId } = (body ?? {}) as Record<string, unknown>

  if (typeof planType !== 'string' || !ALLOWED_PLANS.includes(planType as PlanType)) {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
  }
  if (typeof profileId !== 'string' || !profileId) {
    return NextResponse.json({ error: 'profileId obrigatório.' }, { status: 400 })
  }

  const plan = planType as PlanType

  try {
    const supabase = createSupabaseAdminClient()

    // 2. Buscar perfil do usuário no Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan_type')
      .eq('id', profileId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
    }

    // 3. Verificar se já tem assinatura ativa
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status, plan_type')
      .eq('profile_id', profileId)
      .in('status', ['PENDING', 'ACTIVE', 'PAST_DUE'])
      .maybeSingle()

    if (existingSub) {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura ativa. Gerencie pelo painel.' },
        { status: 409 }
      )
    }

    // 4. Obter ou criar Customer no Asaas
    const customerExternalRef = `profile:${profileId}`
    let asaasCustomer = await findAsaasCustomerByExternalRef(customerExternalRef)

    if (!asaasCustomer) {
      asaasCustomer = await createAsaasCustomer({
        name: profile.full_name ?? 'Cliente Desconto do Dono',
        email: profile.email ?? '',
        externalReference: customerExternalRef,
      })
    }

    // 5. Criar referência externa única para a assinatura
    const externalReference = `sub:${profileId}:${plan}:${Date.now()}`

    // 6. Criar Subscription no Asaas
    const priceCents = getPlanMonthlyPriceCents(plan)
    const subscription = await createAsaasSubscription({
      customer: asaasCustomer.id,
      billingType: 'UNDEFINED', // Deixa o cliente escolher (PIX ou Cartão)
      cycle: 'MONTHLY',
      value: priceCents / 100,
      nextDueDate: nextIsoDate(),
      description: `Desconto do Dono — Plano ${plan}`,
      externalReference,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/planos?sucesso=1`,
      checkoutSession: {
        enabledPaymentMethods: ['CREDIT_CARD', 'PIX'],
      },
    })

    // 7. Salvar assinatura PENDING no Supabase
    const planTypeForDb = plan as 'Essencial' | 'Profissional'
    const { error: insertError } = await supabase.from('subscriptions').insert({
      profile_id: profileId,
      plan_type: planTypeForDb,
      asaas_subscription_id: subscription.id,
      asaas_customer_id: asaasCustomer.id,
      external_reference: externalReference,
      billing_type: 'CREDIT_CARD',
      status: 'PENDING',
    })

    if (insertError) {
      console.error('[CHECKOUT] Erro ao salvar subscription:', insertError)
      return NextResponse.json({ error: 'Erro interno ao criar assinatura.' }, { status: 500 })
    }

    // 8. Obter link de pagamento
    const paymentLink =
      subscription.paymentLink ??
      (await getSubscriptionPaymentLink(subscription.id))

    if (!paymentLink) {
      return NextResponse.json({ error: 'Erro ao obter link de pagamento.' }, { status: 500 })
    }

    return NextResponse.json({ paymentLink }, { status: 201 })
  } catch (err) {
    console.error('[CHECKOUT] Erro inesperado:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
