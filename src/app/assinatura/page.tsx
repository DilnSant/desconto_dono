import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import CancelSubscriptionButton from './CancelSubscriptionButton'

export const metadata: Metadata = {
  title: 'Minha assinatura — Desconto do Dono',
  description: 'Consulte o estado e gerencie sua assinatura do Desconto do Dono.',
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })
const statusLabels: Record<string, string> = {
  PENDING: 'Aguardando confirmação de pagamento',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Pagamento pendente',
  CANCELED: 'Cancelada',
  EXPIRED: 'Encerrada',
  FAILED: 'Não concluída',
}

export default async function SubscriptionPage() {
  const session = await createSupabaseServerClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) redirect('/login?redirect=%2Fassinatura')

  let subscription: {
    plan_type: 'Essencial' | 'Profissional'
    status: string
    current_period_end: string | null
    grace_period_ends_at: string | null
    cancel_at_period_end: boolean
  } | null = null
  let loadFailed = false

  try {
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('subscriptions')
      .select('plan_type, status, current_period_end, grace_period_ends_at, cancel_at_period_end')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    subscription = data
  } catch {
    loadFailed = true
  }

  const canceledHasGrace = subscription?.status === 'CANCELED' && subscription.grace_period_ends_at
  const paidThrough = subscription?.status === 'PAST_DUE' || canceledHasGrace
    ? subscription?.grace_period_ends_at ?? null
    : subscription?.current_period_end ?? null
  const canCancel = subscription && ['ACTIVE', 'PAST_DUE'].includes(subscription.status)

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <Link href="/planos" className="text-sm font-semibold text-green-800 hover:underline">← Planos</Link>
        <h1 className="mt-4 text-3xl font-black text-gray-950">Minha assinatura</h1>
        <p className="mt-2 text-gray-600">Consulte o estado do plano e encerre cobranças recorrentes.</p>
      </header>

      {loadFailed ? (
        <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          Não foi possível consultar a assinatura agora. Tente novamente mais tarde.
        </section>
      ) : !subscription ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-950">Nenhuma assinatura encontrada</h2>
          <p className="mt-2 text-sm text-gray-600">Sua conta pode usar o plano gratuito ou escolher um plano mensal.</p>
          <Link href="/planos" className="mt-5 inline-flex rounded-xl bg-green-800 px-4 py-3 font-bold text-white hover:bg-green-700">
            Ver planos
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">Plano contratado</p>
              <h2 className="mt-1 text-2xl font-black text-gray-950">{subscription.plan_type}</h2>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-bold text-green-900">
              {statusLabels[subscription.status] ?? 'Estado indisponível'}
            </span>
          </div>

          {paidThrough && (
            <p className="mt-5 text-sm leading-relaxed text-gray-700">
              {subscription.status === 'PAST_DUE' ? 'Prazo de tolerância até ' : 'Benefícios disponíveis até '}
              <strong>{dateFormatter.format(new Date(paidThrough))}</strong>.
            </p>
          )}

          {subscription.status === 'CANCELED' && !subscription.cancel_at_period_end && (
            <p className="mt-5 text-sm text-gray-700">A assinatura foi encerrada pelo provedor.</p>
          )}

          {canCancel && <CancelSubscriptionButton paidThrough={paidThrough} />}
          {subscription.status === 'PENDING' && (
            <p className="mt-5 text-sm text-gray-600">O plano permanece gratuito até a confirmação do pagamento pelo Asaas.</p>
          )}
        </section>
      )}
    </main>
  )
}
