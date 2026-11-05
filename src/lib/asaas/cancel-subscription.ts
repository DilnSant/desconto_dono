export type CancellableSubscription = {
  id: string
  asaasSubscriptionId: string | null
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'FAILED'
  currentPeriodEnd: string | null
  gracePeriodEndsAt: string | null
  cancelAtPeriodEnd: boolean
}

export type CancellationDependencies = {
  findSubscription: (profileId: string) => Promise<CancellableSubscription | null>
  cancelAtProvider: (asaasSubscriptionId: string) => Promise<void>
  markCanceled: (subscriptionId: string, profileId: string, canceledAt: string) => Promise<boolean>
  now: () => Date
}

export type CancellationResult =
  | {
      success: true
      alreadyCanceled: boolean
      currentPeriodEnd: string | null
      gracePeriodEndsAt: string | null
    }
  | {
      success: false
      status: 404 | 409 | 502 | 503
      error: string
      providerCanceled?: boolean
    }

export async function cancelSubscription(
  profileId: string,
  dependencies: CancellationDependencies,
): Promise<CancellationResult> {
  let subscription: CancellableSubscription | null
  try {
    subscription = await dependencies.findSubscription(profileId)
  } catch {
    return { success: false, status: 503, error: 'Não foi possível consultar sua assinatura agora.' }
  }

  if (!subscription) {
    return { success: false, status: 404, error: 'Nenhuma assinatura foi encontrada.' }
  }

  if (subscription.status === 'CANCELED' && subscription.cancelAtPeriodEnd) {
    return {
      success: true,
      alreadyCanceled: true,
      currentPeriodEnd: subscription.currentPeriodEnd,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt,
    }
  }

  if (subscription.status !== 'ACTIVE' && subscription.status !== 'PAST_DUE') {
    return {
      success: false,
      status: 409,
      error: 'Esta assinatura ainda não pode ser cancelada. Aguarde a confirmação do pagamento.',
    }
  }

  if (!subscription.asaasSubscriptionId) {
    return { success: false, status: 409, error: 'A assinatura ainda não foi confirmada pelo Asaas.' }
  }

  try {
    await dependencies.cancelAtProvider(subscription.asaasSubscriptionId)
  } catch {
    return { success: false, status: 502, error: 'Não foi possível cancelar as próximas cobranças no Asaas.' }
  }

  try {
    const saved = await dependencies.markCanceled(
      subscription.id,
      profileId,
      dependencies.now().toISOString(),
    )
    if (!saved) {
      return {
        success: false,
        status: 503,
        error: 'O Asaas encerrou as próximas cobranças, mas o status ainda está sendo sincronizado.',
        providerCanceled: true,
      }
    }
  } catch {
    return {
      success: false,
      status: 503,
      error: 'O Asaas encerrou as próximas cobranças, mas o status ainda está sendo sincronizado.',
      providerCanceled: true,
    }
  }

  return {
    success: true,
    alreadyCanceled: false,
    currentPeriodEnd: subscription.currentPeriodEnd,
    gracePeriodEndsAt: subscription.gracePeriodEndsAt,
  }
}
