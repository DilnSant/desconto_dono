import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const serviceUrl = new URL('../src/lib/email/resend.ts', import.meta.url)
const sender = 'Desconto do Dono <faleconosco@descontododono.com.br>'

async function loadEmailService() {
  assert.ok(existsSync(serviceUrl), 'Resend email service module must exist')
  return import(serviceUrl.href)
}

test('sends a lead notification to the supplied database-derived recipient and escapes HTML values', async () => {
  const { createResendEmailService } = await loadEmailService()
  let sentMessage
  let sentOptions
  const service = createResendEmailService({
    apiKey: 're_test',
    from: sender,
    clientFactory: () => ({
      emails: {
        send: async (message, options) => {
          sentMessage = message
          sentOptions = options
          return { data: { id: 'email-2' }, error: null }
        },
      },
    }),
  })

  const result = await service.sendLeadNotification({
    id: 'lead-456',
    recipient: 'empresa@example.com',
    benefitTitle: '<script>Oferta</script>',
    clientName: '<b>Cliente</b>',
    clientWhatsapp: '31999998888',
  })

  assert.deepEqual(result, { sent: true })
  assert.equal(sentMessage.from, sender)
  assert.deepEqual(sentMessage.to, ['empresa@example.com'])
  assert.equal(sentMessage.subject, 'Novo lead para: <script>Oferta</script>')
  assert.match(sentMessage.html, /&lt;script&gt;Oferta&lt;\/script&gt;/)
  assert.match(sentMessage.html, /&lt;b&gt;Cliente&lt;\/b&gt;/)
  assert.equal(sentOptions.idempotencyKey, 'lead-notification/lead-456')
})

test('reports missing Resend configuration without creating a client', async () => {
  const { createResendEmailService } = await loadEmailService()
  const service = createResendEmailService({
    clientFactory: () => {
      assert.fail('client must not be created without configuration')
    },
  })

  const result = await service.sendLeadNotification({
    id: 'lead-789',
    recipient: 'empresa@example.com',
    benefitTitle: 'Oferta de teste',
    clientName: 'João Teste',
    clientWhatsapp: '81999998888',
  })

  assert.deepEqual(result, { sent: false, reason: 'not_configured' })
})

test('uses RESEND_FROM_EMAIL as the only sender setting for lead notifications', async () => {
  const { createResendEmailService } = await loadEmailService()
  const previousSender = process.env.RESEND_FROM_EMAIL
  const previousWaitlistSender = process.env.WAITLIST_FROM_EMAIL
  let sentMessage
  process.env.RESEND_FROM_EMAIL = sender
  process.env.WAITLIST_FROM_EMAIL = 'legacy@example.com'

  try {
    const service = createResendEmailService({
      apiKey: 're_test',
      clientFactory: () => ({
        emails: {
          send: async (message) => {
            sentMessage = message
            return { data: { id: 'email-3' }, error: null }
          },
        },
      }),
    })

    const result = await service.sendLeadNotification({
      id: 'lead-sender-config',
      recipient: 'empresa@example.com',
      benefitTitle: 'Oferta de teste',
      clientName: 'Cliente',
      clientWhatsapp: '31999998888',
    })

    assert.deepEqual(result, { sent: true })
    assert.equal(sentMessage.from, sender)
  } finally {
    if (previousSender === undefined) delete process.env.RESEND_FROM_EMAIL
    else process.env.RESEND_FROM_EMAIL = previousSender
    if (previousWaitlistSender === undefined) delete process.env.WAITLIST_FROM_EMAIL
    else process.env.WAITLIST_FROM_EMAIL = previousWaitlistSender
  }
})

test('exports lead notifications without retaining waitlist confirmation behavior', async () => {
  const emailModule = await loadEmailService()

  assert.equal(typeof emailModule.sendLeadNotification, 'function')
  assert.equal('sendWaitlistConfirmation' in emailModule, false)
})

test('reports provider errors without logging message personal data', async () => {
  const { createResendEmailService } = await loadEmailService()
  const logs = []
  const originalError = console.error
  console.error = (...values) => logs.push(values.join(' '))

  try {
    const service = createResendEmailService({
      apiKey: 're_test',
      from: sender,
      clientFactory: () => ({
        emails: {
          send: async () => ({
            data: null,
            error: { message: 'Rejected recipient maria-private@example.com' },
          }),
        },
      }),
    })

    const result = await service.sendLeadNotification({
      id: 'lead-private',
      recipient: 'maria-private@example.com',
      benefitTitle: 'Oferta privada',
      clientName: 'Pessoa Privada',
      clientWhatsapp: '11999998888',
    })

    assert.deepEqual(result, { sent: false, reason: 'provider_error' })
    assert.equal(logs.join('\n').includes('maria-private@example.com'), false)
    assert.equal(logs.join('\n').includes('Pessoa Privada'), false)
  } finally {
    console.error = originalError
  }
})
