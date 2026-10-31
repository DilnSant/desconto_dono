import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const helperPath = new URL('../src/lib/email/waitlist-confirmation.ts', import.meta.url)

const input = {
  id: '98bd2a0a-5cb8-4b3b-ad5d-5e1c74a9d8e2',
  fullName: 'Ana Souza',
  email: 'ana@example.com',
  city: 'Curitiba',
  state: 'PR',
}

const loadSender = async () => {
  assert.ok(existsSync(helperPath), 'waitlist confirmation helper should exist')
  const { sendWaitlistConfirmation } = await import(helperPath.href)
  return sendWaitlistConfirmation
}

const setEnv = (t, values) => {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]])
  )

  Object.assign(process.env, values)
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })
}

const mockFetch = (t, implementation) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = implementation
  t.after(() => {
    globalThis.fetch = originalFetch
  })
}

test('sends a Portuguese confirmation with the recipient and row idempotency key', async (t) => {
  setEnv(t, {
    RESEND_API_KEY: 're_test_key',
    WAITLIST_FROM_EMAIL: 'Desconto do Dono <noreply@example.com>',
  })
  const requests = []
  mockFetch(t, async (url, init) => {
    requests.push({
      url: String(url),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)),
    })
    return new Response(JSON.stringify({ id: 'resend-message-id' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })

  const sendWaitlistConfirmation = await loadSender()
  const result = await sendWaitlistConfirmation(input)

  assert.deepEqual(result, { sent: true })
  assert.equal(requests.length, 1)
  assert.equal(requests[0].body.subject, 'Cadastro recebido com sucesso')
  assert.deepEqual(requests[0].body.to, [input.email])
  assert.equal(
    requests[0].headers.get('idempotency-key'),
    `waitlist-confirmation/${input.id}`
  )
  assert.match(requests[0].body.text, /Curitiba\/PR/)
})

test('does not make a provider request when configuration is missing', async (t) => {
  setEnv(t, { RESEND_API_KEY: '', WAITLIST_FROM_EMAIL: '' })
  let requests = 0
  mockFetch(t, async () => {
    requests += 1
    return new Response('{}')
  })

  const sendWaitlistConfirmation = await loadSender()
  const result = await sendWaitlistConfirmation(input)

  assert.equal(result.sent, false)
  assert.ok(result.error)
  assert.equal(requests, 0)
})

test('preserves a controlled failure result when the provider rejects the email', async (t) => {
  t.mock.method(console, 'error', () => {})
  setEnv(t, {
    RESEND_API_KEY: 're_test_key',
    WAITLIST_FROM_EMAIL: 'Desconto do Dono <noreply@example.com>',
  })
  mockFetch(t, async () => new Response(
    JSON.stringify({ name: 'validation_error', message: 'provider rejected request' }),
    { status: 422, headers: { 'content-type': 'application/json' } }
  ))

  const sendWaitlistConfirmation = await loadSender()
  const result = await sendWaitlistConfirmation(input)

  assert.equal(result.sent, false)
  assert.ok(result.error)
})
