import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('routes signup confirmation through the app callback on the active site origin', async () => {
  const registration = await readFile(new URL('../src/components/auth/RegisterForm.tsx', import.meta.url), 'utf8')
  assert.match(registration, /emailRedirectTo:\s*getAuthCallbackUrl\(window\.location\.origin\)/)
  assert.match(registration, /Confirme o link enviado para \{form\.email\}/)

  const callback = await readFile(new URL('../src/app/auth/callback/route.ts', import.meta.url), 'utf8')
  assert.match(callback, /searchParams\.get\('code'\)/)
  assert.match(callback, /exchangeCodeForSession\(code\)/)
})

test('lets an unconfirmed user resend a signup email through the same callback', async () => {
  const login = await readFile(new URL('../src/components/auth/LoginForm.tsx', import.meta.url), 'utf8')
  assert.match(login, /supabase\.auth\.resend\(/)
  assert.match(login, /type:\s*'signup'/)
  assert.match(login, /emailRedirectTo:\s*getAuthCallbackUrl\(window\.location\.origin\)/)
})

test('builds an absolute callback URL at the current app origin', async () => {
  const helperUrl = new URL('../src/lib/auth/redirects.ts', import.meta.url)
  assert.ok(existsSync(helperUrl), 'auth redirects should share one canonical callback URL')
  const { getAuthCallbackUrl } = await import(helperUrl)
  assert.equal(getAuthCallbackUrl('https://www.descontododono.com.br'), 'https://www.descontododono.com.br/auth/callback')
  assert.equal(getAuthCallbackUrl('http://localhost:3000'), 'http://localhost:3000/auth/callback')
})
