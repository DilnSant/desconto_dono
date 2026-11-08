export function getAuthCallbackUrl(origin: string): string {
  return new URL('/auth/callback', origin).toString()
}
