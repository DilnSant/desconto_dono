import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const form = readFileSync(
  new URL('../src/components/landing/LandingPage.tsx', import.meta.url),
  'utf8'
)

test('submits the hidden honeypot with the waitlist request', () => {
  assert.match(form, /website:\s*''/)
  assert.match(form, /id="wl-website"/)
  assert.match(form, /aria-hidden="true"/)
  assert.match(form, /tabIndex=\{-1\}/)
  assert.match(form, /autoComplete="off"/)
  assert.match(form, /body:\s*JSON\.stringify\(form\)/)
})

test('distinguishes email delivery from registration and hides an unknown position', () => {
  assert.match(form, /emailSent/)
  assert.match(form, /position !== null/)
  assert.match(form, /e-mail.*confirmação|confirmação.*e-mail/i)
  assert.match(form, /json\.emailSent/)
})

test('keeps API errors visible in the form', () => {
  assert.match(form, /setError\(err instanceof Error \? err\.message/)
  assert.match(form, /\{error && \(/)
})
