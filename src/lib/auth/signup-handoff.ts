export interface SignupHandoff {
  email: string
  password: string
}

const HANDOFF_LIFETIME_MS = 60_000

let pendingHandoff: SignupHandoff | null = null
let expirationTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

function notifySubscribers(): void {
  listeners.forEach((listener) => listener())
}

export function setSignupHandoff(credentials: SignupHandoff): void {
  if (expirationTimer) clearTimeout(expirationTimer)
  pendingHandoff = {
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  }
  expirationTimer = setTimeout(() => {
    pendingHandoff = null
    expirationTimer = null
    notifySubscribers()
  }, HANDOFF_LIFETIME_MS)
  notifySubscribers()
}

export function takeSignupHandoff(): SignupHandoff | null {
  const handoff = pendingHandoff
  pendingHandoff = null
  if (expirationTimer) clearTimeout(expirationTimer)
  expirationTimer = null
  if (handoff) notifySubscribers()
  return handoff
}

export function subscribeSignupHandoff(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSignupHandoffSnapshot(): SignupHandoff | null {
  return pendingHandoff
}

export function getSignupHandoffServerSnapshot(): SignupHandoff | null {
  return null
}
