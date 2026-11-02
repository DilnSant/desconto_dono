import type {
  AsaasCreateCustomerInput,
  AsaasCreateSubscriptionInput,
  AsaasCustomer,
  AsaasSubscription,
  AsaasPaymentCheckoutSession,
} from './types'

const BASE_URLS = {
  sandbox: 'https://sandbox.asaas.com/api/v3',
  production: 'https://www.asaas.com/api/v3',
} as const

function getAsaasBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_ASAAS_ENV === 'production' ? 'production' : 'sandbox'
  return BASE_URLS[env]
}

function getAsaasApiKey(): string {
  const key = process.env.ASAAS_API_KEY
  if (!key?.trim()) throw new Error('ASAAS_API_KEY não configurada.')
  return key.trim()
}

async function asaasFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getAsaasBaseUrl()}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': getAsaasApiKey(),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let body: unknown
    try { body = await res.json() } catch { body = null }
    console.error('[ASAAS] Erro na API:', res.status, body)
    throw new Error(`Asaas API error ${res.status}: ${JSON.stringify(body)}`)
  }

  return res.json() as Promise<T>
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function createAsaasCustomer(
  input: AsaasCreateCustomerInput
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function findAsaasCustomerByExternalRef(
  externalReference: string
): Promise<AsaasCustomer | null> {
  const data = await asaasFetch<{ data: AsaasCustomer[]; totalCount: number }>(
    `/customers?externalReference=${encodeURIComponent(externalReference)}&limit=1`
  )
  return data.data[0] ?? null
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function createAsaasSubscription(
  input: AsaasCreateSubscriptionInput
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// ─── Checkout Session ─────────────────────────────────────────────────────────

export async function getSubscriptionCheckoutSession(
  subscriptionId: string
): Promise<AsaasPaymentCheckoutSession | null> {
  try {
    return await asaasFetch<AsaasPaymentCheckoutSession>(
      `/subscriptions/${subscriptionId}/checkoutSession`
    )
  } catch {
    return null
  }
}

export async function getSubscriptionPaymentLink(
  subscriptionId: string
): Promise<string | null> {
  const sub = await asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`)
  return sub.paymentLink ?? null
}
