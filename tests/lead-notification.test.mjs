import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const serviceUrl = new URL('../src/lib/leads/create-lead.ts', import.meta.url)

async function loadLeadService() {
  assert.ok(existsSync(serviceUrl), 'lead service module must exist')
  return import(serviceUrl.href)
}

const validInput = {
  offerId: 'benefit-123',
  clientName: ' Maria Teste ',
  clientWhatsapp: '(31) 99999-8888',
}

function createDependencies(overrides = {}) {
  return {
    findActiveBenefit: async (offerId) => ({
      id: offerId,
      title: 'Desconto especial',
      authorId: 'owner-123',
    }),
    findPublicEmail: async () => 'empresa@example.com',
    insertLead: async () => {},
    sendNotification: async () => ({ sent: true }),
    createId: () => 'lead-123',
    ...overrides,
  }
}

test('rejects invalid lead data before looking up or inserting a benefit', async () => {
  const { createLead } = await loadLeadService()
  let lookupCount = 0
  let insertCount = 0
  const result = await createLead(
    { ...validInput, clientWhatsapp: '12345' },
    createDependencies({
      findActiveBenefit: async () => {
        lookupCount += 1
        return null
      },
      insertLead: async () => {
        insertCount += 1
      },
    })
  )

  assert.deepEqual(result, {
    success: false,
    status: 400,
    error: 'Informe um WhatsApp válido com DDD.',
  })
  assert.equal(lookupCount, 0)
  assert.equal(insertCount, 0)
})

test('does not create or notify a lead for an unknown or inactive benefit', async () => {
  const { createLead } = await loadLeadService()
  let insertCount = 0
  let emailCount = 0
  const result = await createLead(
    validInput,
    createDependencies({
      findActiveBenefit: async () => null,
      insertLead: async () => {
        insertCount += 1
      },
      sendNotification: async () => {
        emailCount += 1
        return { sent: true }
      },
    })
  )

  assert.deepEqual(result, {
    success: false,
    status: 404,
    error: 'Benefício não encontrado ou indisponível.',
  })
  assert.equal(insertCount, 0)
  assert.equal(emailCount, 0)
})

test('persists the lead and notifies the benefit owner public email', async () => {
  const { createLead } = await loadLeadService()
  const events = []
  let inserted
  let notification
  const result = await createLead(
    validInput,
    createDependencies({
      insertLead: async (input) => {
        events.push('insert')
        inserted = input
      },
      sendNotification: async (input) => {
        events.push('email')
        notification = input
        return { sent: true }
      },
    })
  )

  assert.deepEqual(result, {
    success: true,
    leadId: 'lead-123',
    emailStatus: 'sent',
  })
  assert.deepEqual(events, ['insert', 'email'])
  assert.deepEqual(inserted, {
    id: 'lead-123',
    offerId: 'benefit-123',
    clientName: 'Maria Teste',
    clientWhatsapp: '31999998888',
  })
  assert.deepEqual(notification, {
    id: 'lead-123',
    recipient: 'empresa@example.com',
    benefitTitle: 'Desconto especial',
    clientName: 'Maria Teste',
    clientWhatsapp: '31999998888',
  })
})

test('persists the lead and skips notification when the owner has no public email', async () => {
  const { createLead } = await loadLeadService()
  let insertCount = 0
  let emailCount = 0
  const result = await createLead(
    validInput,
    createDependencies({
      findPublicEmail: async () => null,
      insertLead: async () => {
        insertCount += 1
      },
      sendNotification: async () => {
        emailCount += 1
        return { sent: true }
      },
    })
  )

  assert.deepEqual(result, {
    success: true,
    leadId: 'lead-123',
    emailStatus: 'skipped_no_public_email',
  })
  assert.equal(insertCount, 1)
  assert.equal(emailCount, 0)
})

test('keeps the lead saved and reports failed delivery when Resend rejects notification', async () => {
  const { createLead } = await loadLeadService()
  let insertCount = 0
  const result = await createLead(
    validInput,
    createDependencies({
      insertLead: async () => {
        insertCount += 1
      },
      sendNotification: async () => ({ sent: false, reason: 'provider_error' }),
    })
  )

  assert.deepEqual(result, {
    success: true,
    leadId: 'lead-123',
    emailStatus: 'failed',
  })
  assert.equal(insertCount, 1)
})

test('returns a server failure when benefit lookup fails', async () => {
  const { createLead } = await loadLeadService()
  const result = await createLead(
    validInput,
    createDependencies({
      findActiveBenefit: async () => {
        throw new Error('Database details')
      },
    })
  )

  assert.deepEqual(result, {
    success: false,
    status: 500,
    error: 'Erro interno ao registrar o interesse. Tente novamente.',
  })
})

test('returns a server failure when public profile lookup fails', async () => {
  const { createLead } = await loadLeadService()
  const result = await createLead(
    validInput,
    createDependencies({
      findPublicEmail: async () => {
        throw new Error('Database details')
      },
    })
  )

  assert.deepEqual(result, {
    success: false,
    status: 500,
    error: 'Erro interno ao registrar o interesse. Tente novamente.',
  })
})

test('returns a server failure when inserting the lead fails without notifying', async () => {
  const { createLead } = await loadLeadService()
  let emailCount = 0
  const result = await createLead(
    validInput,
    createDependencies({
      insertLead: async () => {
        throw new Error('Database details')
      },
      sendNotification: async () => {
        emailCount += 1
        return { sent: true }
      },
    })
  )

  assert.deepEqual(result, {
    success: false,
    status: 500,
    error: 'Erro interno ao registrar o interesse. Tente novamente.',
  })
  assert.equal(emailCount, 0)
})
