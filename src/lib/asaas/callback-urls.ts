export interface CheckoutCallbackUrls {
  successUrl: string
  cancelUrl: string
  expiredUrl: string
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function configuredOrigin(value: string | undefined, request: URL): string | null {
  if (!value?.trim()) return null

  try {
    const url = new URL(value.trim())
    if (
      url.protocol !== 'https:' && url.protocol !== 'http:'
      || (LOOPBACK_HOSTS.has(url.hostname) && !LOOPBACK_HOSTS.has(request.hostname))
      || (url.protocol === 'http:' && (!LOOPBACK_HOSTS.has(url.hostname) || !LOOPBACK_HOSTS.has(request.hostname)))
      || url.username
      || url.password
      || !url.hostname
    ) return null

    return url.origin
  } catch {
    return null
  }
}

function deploymentOrigin(value: string | undefined): string | null {
  const host = value?.trim()
  if (!host || /[\/?#@\\\s]/.test(host)) return null

  try {
    const url = new URL(`https://${host}`)
    if (!url.hostname || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      return null
    }
    return url.origin
  } catch {
    return null
  }
}

export function getCheckoutCallbackUrls(
  requestUrl: string,
  configuredBaseUrl?: string,
  vercelUrl?: string,
): CheckoutCallbackUrls {
  const request = new URL(requestUrl)
  let origin = configuredOrigin(configuredBaseUrl, request) ?? deploymentOrigin(vercelUrl)

  if (!origin) {
    if ((request.protocol === 'http:' || request.protocol === 'https:') && LOOPBACK_HOSTS.has(request.hostname)) {
      origin = request.origin
    }
  }

  if (!origin) {
    throw new Error('Configure NEXT_PUBLIC_APP_URL or VERCEL_URL for trusted checkout callbacks.')
  }

  return {
    successUrl: new URL('/planos?retorno=sucesso', origin).toString(),
    cancelUrl: new URL('/planos?retorno=cancelado', origin).toString(),
    expiredUrl: new URL('/planos?retorno=expirado', origin).toString(),
  }
}
