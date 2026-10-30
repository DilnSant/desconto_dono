import assert from 'node:assert/strict'
import test from 'node:test'
import { getAdminLoginErrorMessage } from '../src/lib/auth/admin-login-message.ts'

test('shows confirmation SQL guidance only for the admin email when unconfirmed', () => {
  const message = getAdminLoginErrorMessage(
    '  MetodoDevelops@gmail.com ',
    'Email not confirmed'
  )

  assert.match(message ?? '', /UPDATE auth\.users SET email_confirmed_at = NOW\(\)/)
  assert.match(message ?? '', /metododevelops@gmail\.com/)
})

test('does not show admin confirmation SQL guidance for other login errors', () => {
  assert.equal(
    getAdminLoginErrorMessage('metododevelops@gmail.com', 'Invalid login credentials'),
    null
  )
})

test('does not show admin confirmation SQL guidance for another email', () => {
  assert.equal(
    getAdminLoginErrorMessage('user@example.com', 'Email not confirmed'),
    null
  )
})
