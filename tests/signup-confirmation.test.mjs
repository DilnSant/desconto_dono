import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('routes signup confirmation through the app callback on the active site origin', async () => {
  const registration = await readFile(new URL('../src/components/auth/RegisterForm.tsx', import.meta.url), 'utf8')
  assert.match(registration, /emailRedirectTo:\s*getAuthCallbackUrl\(window\.location\.origin\)/)
  assert.match(registration, /o link pode demorar/)
  assert.match(registration, /handleResendConfirmation/)
  assert.match(registration, /setSignupHandoff/)
  assert.match(registration, /onClick=\{\(\) => setSignupHandoff/)

  const login = await readFile(new URL('../src/components/auth/LoginForm.tsx', import.meta.url), 'utf8')
  assert.match(login, /useSyncExternalStore/)
  assert.match(login, /const loginEmail = email \|\| signupHandoff\?\.email/)
  assert.match(login, /const loginPassword = password \|\| signupHandoff\?\.password/)
  assert.match(login, /takeSignupHandoff/)
  assert.match(login, /setEmail\(handoff\.email\)/)
  assert.match(login, /setPassword\(handoff\.password\)/)

  const handoff = await readFile(new URL('../src/lib/auth/signup-handoff.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(handoff, /sessionStorage|localStorage|URLSearchParams/)

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

test('transfers signup credentials in memory for one login navigation only', async () => {
  const helperUrl = new URL('../src/lib/auth/signup-handoff.ts', import.meta.url)
  const { setSignupHandoff, takeSignupHandoff } = await import(helperUrl)

  setSignupHandoff({ email: 'person@example.com', password: 'temporary-password' })
  assert.deepEqual(takeSignupHandoff(), {
    email: 'person@example.com',
    password: 'temporary-password',
  })
  assert.equal(takeSignupHandoff(), null)
})
