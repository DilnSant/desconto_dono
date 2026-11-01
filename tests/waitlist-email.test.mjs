import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const handlerUrl = new URL('../src/lib/waitlist/handler.ts', import.meta.url)

async function loadHandler() {
  assert.ok(existsSync(handlerUrl), 'waitlist handler module must exist')
  return import(handlerUrl.href)
}

function request(body) {
  return new Request('http://localhost/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validPayload = {
  full_name: ' Maria Teste ',
  email: ' Maria@Example.com ',
  city: ' Belo Horizonte ',
  state: 'mg',
  category_id: '',
  has_company: true,
  accepted_terms: true,
}

test('persists a new waitlist registration and sends confirmation afterward', async () => {
  const { createWaitlistPostHandler } = await loadHandler()
  const events = []
  let inserted
  let confirmation
  const handler = createWaitlistPostHandler({
    createId: () => 'waitlist-123',
    insert: async (input) => {
      events.push('insert')
      inserted = input
      return {}
    },
    getCityPosition: async (city, state) => {
      assert.equal(city, 'Belo Horizonte')
      assert.equal(state, 'MG')
      return 4
    },
    sendConfirmation: async (input) => {
      events.push('email')
      confirmation = input
      return { sent: true }
    },
  })

  const response = await handler(request(validPayload))
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(events, ['insert', 'email'])
  assert.equal(inserted.id, 'waitlist-123')
  assert.equal(inserted.full_name, 'Maria Teste')
  assert.equal(inserted.email, 'maria@example.com')
  assert.equal(inserted.city, 'Belo Horizonte')
  assert.equal(inserted.state, 'MG')
  assert.equal(inserted.category_id, null)
  assert.equal(inserted.accepted_terms, true)
  assert.deepEqual(confirmation, {
    id: 'waitlist-123',
    fullName: 'Maria Teste',
    email: 'maria@example.com',
    city: 'Belo Horizonte',
    state: 'MG',
  })
  assert.deepEqual(body, {
    success: true,
    id: 'waitlist-123',
    position: 4,
    city: 'Belo Horizonte',
    emailSent: true,
  })
})

test('keeps a saved registration successful when confirmation delivery fails', async () => {
  const { createWaitlistPostHandler } = await loadHandler()
  let insertCount = 0
  const handler = createWaitlistPostHandler({
    createId: () => 'waitlist-456',
    insert: async () => {
      insertCount += 1
      return {}
    },
    getCityPosition: async () => 1,
    sendConfirmation: async () => ({ sent: false, reason: 'provider_error' }),
  })

  const response = await handler(request(validPayload))
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(insertCount, 1)
  assert.equal(body.success, true)
  assert.equal(body.emailSent, false)
  assert.equal(body.id, 'waitlist-456')
})

test('returns conflict for a unique-email violation without sending confirmation', async () => {
  const { createWaitlistPostHandler } = await loadHandler()
  let insertCount = 0
  let emailCount = 0
  const handler = createWaitlistPostHandler({
    createId: () => 'waitlist-789',
    insert: async () => {
      insertCount += 1
      return { errorCode: '23505' }
    },
    getCityPosition: async () => 1,
    sendConfirmation: async () => {
      emailCount += 1
      return { sent: true }
    },
  })

  const response = await handler(request(validPayload))
  const body = await response.json()

  assert.equal(response.status, 409)
  assert.match(body.error, /já está cadastrado/)
  assert.equal(insertCount, 1)
  assert.equal(emailCount, 0)
})

test('returns a controlled bad-request response for malformed JSON', async () => {
  const { createWaitlistPostHandler } = await loadHandler()
  const handler = createWaitlistPostHandler({
    createId: () => 'waitlist-ignored',
    insert: async () => ({}),
    getCityPosition: async () => 1,
    sendConfirmation: async () => ({ sent: true }),
  })

  const response = await handler(new Request('http://localhost/api/waitlist', {
    method: 'POST',
    body: '{',
  }))

  assert.equal(response.status, 400)
})

test('does not send confirmation when the registration insert fails', async () => {
  const { createWaitlistPostHandler } = await loadHandler()
  let emailCount = 0
  const handler = createWaitlistPostHandler({
    createId: () => 'waitlist-fail',
    insert: async () => ({ errorCode: 'unexpected' }),
    getCityPosition: async () => 1,
    sendConfirmation: async () => {
      emailCount += 1
      return { sent: true }
    },
  })

  const response = await handler(request(validPayload))

  assert.equal(response.status, 500)
  assert.equal(emailCount, 0)
})

test('keeps a saved registration and sends confirmation when position lookup fails', async () => {
  const { createWaitlistPostHandler } = await loadHandler()
  let emailCount = 0
  const handler = createWaitlistPostHandler({
    createId: () => 'waitlist-rank-failure',
    insert: async () => ({}),
    getCityPosition: async () => {
      throw new Error('Database query details')
    },
    sendConfirmation: async () => {
      emailCount += 1
      return { sent: true }
    },
  })

  const response = await handler(request(validPayload))
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.emailSent, true)
  assert.equal(body.position, null)
  assert.match(body.notice, /posição/)
  assert.equal(emailCount, 1)
})
