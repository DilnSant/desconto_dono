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

export class AsaasApiError extends Error {
  constructor(
    readonly status: number,
    readonly codes: string[],
  ) {
    super(`Asaas API error ${status}`)
    this.name = 'AsaasApiError'
  }
}

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
    let payload: unknown
    try {
      payload = await res.json()
    } catch {
      payload = null
    }
    const errors = typeof payload === 'object' && payload !== null && 'errors' in payload
      ? (payload as { errors?: unknown }).errors
      : null
    const codes = Array.isArray(errors)
      ? [...new Set(errors.flatMap((item) => {
        if (typeof item !== 'object' || item === null || !('code' in item)) return []
        const code = (item as { code?: unknown }).code
        return typeof code === 'string' && /^[A-Za-z0-9_.-]{1,64}$/.test(code) ? [code] : []
      }))]
      : []
    throw new AsaasApiError(res.status, codes)
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
