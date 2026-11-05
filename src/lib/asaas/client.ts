import type {
  AsaasCreateCustomerInput,
  AsaasCreateSubscriptionInput,
  AsaasCustomer,
  AsaasSubscription,
  AsaasPaymentCheckoutSession,
  AsaasCheckout,
  AsaasCreateCheckoutInput,
  AsaasCreateCheckoutResponse,
  AsaasPayment,
} from './types'

const BASE_URLS = {
  sandbox: 'https://api-sandbox.asaas.com/v3',
  production: 'https://api.asaas.com/v3',
} as const

function getAsaasBaseUrl(): string {
  const env = process.env.ASAAS_ENV === 'production' ? 'production' : 'sandbox'
  return BASE_URLS[env]
}

export async function createAsaasCheckout(input: AsaasCreateCheckoutInput): Promise<AsaasCreateCheckoutResponse> {
  return asaasFetch<AsaasCreateCheckoutResponse>('/checkouts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function getAsaasCheckout(checkoutId: string): Promise<AsaasCheckout> {
  return asaasFetch<AsaasCheckout>(`/checkouts/${encodeURIComponent(checkoutId)}`)
}

export async function getAsaasPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}`)
}

export async function getAsaasSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`)
}

export async function deactivateAsaasSubscription(subscriptionId: string): Promise<void> {
  await asaasFetch<void>(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'INACTIVE' }),
  })
}

export function getAsaasCheckoutUrl(checkoutId: string): string {
  return `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`
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
    throw new Error(`Asaas API error ${res.status}`)
  }

  if (options.method === 'DELETE' || res.status === 204) return undefined as T

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
