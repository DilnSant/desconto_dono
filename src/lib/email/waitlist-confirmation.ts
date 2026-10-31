import { Resend } from 'resend'

export interface WaitlistConfirmation {
  id: string
  fullName: string
  email: string
  city: string
  state: string
}

export type WaitlistConfirmationResult =
  | { sent: true }
  | { sent: false; error: string }

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)

const unavailableMessage =
  'O cadastro foi realizado, mas não foi possível enviar o e-mail de confirmação.'

export async function sendWaitlistConfirmation(
  input: WaitlistConfirmation
): Promise<WaitlistConfirmationResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.WAITLIST_FROM_EMAIL?.trim()

  if (!apiKey || !from) {
    return {
      sent: false,
      error: 'O envio de e-mail não está configurado no servidor.',
    }
  }

  const resend = new Resend(apiKey)
  const location = `${input.city}/${input.state}`

  try {
    const { error } = await resend.emails.send(
      {
        from,
        to: [input.email],
        subject: 'Cadastro recebido com sucesso',
        text: `Olá, ${input.fullName}!\n\nSeu cadastro na lista de espera do Desconto do Dono foi recebido com sucesso. Avisaremos você por e-mail quando houver novidades para ${location}.\n\nObrigado por fazer parte da comunidade!`,
        html: `<p>Olá, ${escapeHtml(input.fullName)}!</p><p>Seu cadastro na lista de espera do Desconto do Dono foi recebido com sucesso. Avisaremos você por e-mail quando houver novidades para ${escapeHtml(location)}.</p><p>Obrigado por fazer parte da comunidade!</p>`,
      },
      { idempotencyKey: `waitlist-confirmation/${input.id}` }
    )

    if (error) {
      console.error('[WAITLIST EMAIL] Provider rejected confirmation', {
        name: error.name,
        statusCode: error.statusCode,
      })
      return { sent: false, error: unavailableMessage }
    }

    return { sent: true }
  } catch (error) {
    console.error('[WAITLIST EMAIL] Provider request failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    return { sent: false, error: unavailableMessage }
  }
}
