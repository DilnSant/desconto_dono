import 'server-only'
import { NextResponse } from 'next/server'
import { deactivateAsaasSubscription } from '@/lib/asaas/client'
import { cancelSubscription } from '@/lib/asaas/cancel-subscription'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST() {
  const sessionClient = await createSupabaseServerClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 })

  try {
    const admin = createSupabaseAdminClient()
    const result = await cancelSubscription(user.id, {
      findSubscription: async (profileId) => {
        const { data, error } = await admin
          .from('subscriptions')
          .select('id, asaas_subscription_id, status, current_period_end, grace_period_ends_at, cancel_at_period_end')
          .eq('profile_id', profileId)
          .in('status', ['PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELED'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw error
        if (!data) return null
        return {
          id: data.id,
          asaasSubscriptionId: data.asaas_subscription_id,
          status: data.status,
          currentPeriodEnd: data.current_period_end,
          gracePeriodEndsAt: data.grace_period_ends_at,
          cancelAtPeriodEnd: data.cancel_at_period_end,
        }
      },
      cancelAtProvider: deactivateAsaasSubscription,
      markCanceled: async (subscriptionId, profileId, canceledAt) => {
        const { data, error } = await admin
          .from('subscriptions')
          .update({
            status: 'CANCELED',
            cancel_at_period_end: true,
            updated_at: canceledAt,
          })
          .eq('id', subscriptionId)
          .eq('profile_id', profileId)
          .in('status', ['ACTIVE', 'PAST_DUE'])
          .select('id')
          .maybeSingle()

        if (error) throw error
        return Boolean(data)
      },
      now: () => new Date(),
    })

    if (!result.success) {
      if (result.providerCanceled) {
        console.error('[ASAAS CANCEL] Provider cancellation awaits local synchronization')
      }
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      canceled: true,
      alreadyCanceled: result.alreadyCanceled,
      currentPeriodEnd: result.currentPeriodEnd,
      gracePeriodEndsAt: result.gracePeriodEndsAt,
    })
  } catch {
    console.error('[ASAAS CANCEL] Cancellation request failed')
    return NextResponse.json({ error: 'Não foi possível cancelar sua assinatura agora.' }, { status: 503 })
  }
}
