import { Resend } from 'resend'

export type EmailDeliveryResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' | 'provider_error' }

type LeadNotification = {
  id: string
  recipient: string
  benefitTitle: string
  clientName: string
  clientWhatsapp: string
}

type ResendClient = Pick<Resend, 'emails'>

type ResendEmailServiceOptions = {
  apiKey?: string
  from?: string
  clientFactory?: (apiKey: string) => ResendClient
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function createResendEmailService(options: ResendEmailServiceOptions = {}) {
  const apiKey = options.apiKey ?? process.env.RESEND_API_KEY
  const from = options.from ?? process.env.RESEND_FROM_EMAIL
  const clientFactory = options.clientFactory ?? ((key: string) => new Resend(key))
  let client: ResendClient | undefined

  const send = async (input: {
    id: string
    recipient: string
    subject: string
    text: string
    html: string
    idempotencyKey: string
  }): Promise<EmailDeliveryResult> => {
    if (!apiKey?.trim() || !from?.trim()) {
      return { sent: false, reason: 'not_configured' }
    }

    try {
      client ??= clientFactory(apiKey)
      const { error } = await client.emails.send(
        {
          from,
          to: [input.recipient],
          subject: input.subject,
          text: input.text,
          html: input.html,
        },
        { idempotencyKey: input.idempotencyKey }
      )

      if (error) {
        console.error('[RESEND EMAIL] Provider rejected transactional email')
        return { sent: false, reason: 'provider_error' }
      }

      return { sent: true }
    } catch {
      console.error('[RESEND EMAIL] Failed to send transactional email')
      return { sent: false, reason: 'provider_error' }
    }
  }

  return {
    sendLeadNotification(input: LeadNotification) {
      const benefitTitle = escapeHtml(input.benefitTitle)
      const clientName = escapeHtml(input.clientName)
      const clientWhatsapp = escapeHtml(input.clientWhatsapp)
      return send({
        id: input.id,
        recipient: input.recipient,
        subject: `Novo lead para: ${input.benefitTitle}`,
        text: `Você recebeu um novo lead para o benefício "${input.benefitTitle}".\n\nNome: ${input.clientName}\nWhatsApp: ${input.clientWhatsapp}`,
        html: `<p>Você recebeu um novo lead para o benefício <strong>${benefitTitle}</strong>.</p><p>Nome: ${clientName}<br>WhatsApp: ${clientWhatsapp}</p>`,
        idempotencyKey: `lead-notification/${input.id}`,
      })
    },
  }
}

const emailService = createResendEmailService()

export const sendLeadNotification = emailService.sendLeadNotification
