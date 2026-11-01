import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const serviceUrl = new URL('../src/lib/email/resend.ts', import.meta.url)
const sender = 'Desconto do Dono <faleconosco@descontododono.com.br>'

async function loadEmailService() {
  assert.ok(existsSync(serviceUrl), 'Resend email service module must exist')
  return import(serviceUrl.href)
}

test('sends a waitlist confirmation from the configured sender with a stable idempotency key', async () => {
  const { createResendEmailService } = await loadEmailService()
  let sentMessage
  let sentOptions
  const service = createResendEmailService({
    apiKey: 're_test',
    from: sender,
    clientFactory: (apiKey) => {
      assert.equal(apiKey, 're_test')
      return {
        emails: {
          send: async (message, options) => {
            sentMessage = message
            sentOptions = options
            return { data: { id: 'email-1' }, error: null }
          },
        },
      }
    },
  })

  const result = await service.sendWaitlistConfirmation({
    id: 'waitlist-123',
    fullName: 'Maria Teste',
    email: 'maria@example.com',
    city: 'Belo Horizonte',
    state: 'MG',
  })

  assert.deepEqual(result, { sent: true })
  assert.equal(sentMessage.from, sender)
  assert.deepEqual(sentMessage.to, ['maria@example.com'])
  assert.equal(sentMessage.subject, 'Cadastro recebido com sucesso')
  assert.match(sentMessage.text, /Maria Teste/)
  assert.equal(sentOptions.idempotencyKey, 'waitlist-confirmation/waitlist-123')
})

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

  const result = await service.sendWaitlistConfirmation({
    id: 'waitlist-789',
    fullName: 'João Teste',
    email: 'joao@example.com',
    city: 'Recife',
    state: 'PE',
  })

  assert.deepEqual(result, { sent: false, reason: 'not_configured' })
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

    const result = await service.sendWaitlistConfirmation({
      id: 'waitlist-private',
      fullName: 'Pessoa Privada',
      email: 'maria-private@example.com',
      city: 'São Paulo',
      state: 'SP',
    })

    assert.deepEqual(result, { sent: false, reason: 'provider_error' })
    assert.equal(logs.join('\n').includes('maria-private@example.com'), false)
    assert.equal(logs.join('\n').includes('Pessoa Privada'), false)
  } finally {
    console.error = originalError
  }
})
