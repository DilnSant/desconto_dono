import type { EmailDeliveryResult } from '@/lib/email/resend'

type ActiveBenefit = {
  id: string
  title: string
  authorId: string
}

type LeadInsert = {
  id: string
  offerId: string
  clientName: string
  clientWhatsapp: string
}

type LeadNotification = {
  id: string
  recipient: string
  benefitTitle: string
  clientName: string
  clientWhatsapp: string
}

type CreateLeadDependencies = {
  findActiveBenefit: (offerId: string) => Promise<ActiveBenefit | null>
  findPublicEmail: (authorId: string) => Promise<string | null>
  insertLead: (input: LeadInsert) => Promise<void>
  sendNotification: (input: LeadNotification) => Promise<EmailDeliveryResult>
  createId: () => string
}

type CreateLeadResult =
  | {
      success: true
      leadId: string
      emailStatus: 'sent' | 'skipped_no_public_email' | 'failed'
    }
  | {
      success: false
      status: 400 | 404 | 500
      error: string
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function failure(status: 400 | 404 | 500, error: string): CreateLeadResult {
  return { success: false, status, error }
}

export async function createLead(
  input: unknown,
  dependencies: CreateLeadDependencies
): Promise<CreateLeadResult> {
  if (!isRecord(input)) {
    return failure(400, 'Dados inválidos.')
  }

  const { offerId, clientName, clientWhatsapp } = input
  const whatsapp = typeof clientWhatsapp === 'string' ? clientWhatsapp.replace(/\D/g, '') : ''
  if (
    typeof offerId !== 'string' ||
    !offerId.trim() ||
    typeof clientName !== 'string' ||
    !clientName.trim()
  ) {
    return failure(400, 'Preencha seu nome e selecione um benefício.')
  }
  if (whatsapp.length !== 10 && whatsapp.length !== 11) {
    return failure(400, 'Informe um WhatsApp válido com DDD.')
  }

  const normalized = {
    offerId: offerId.trim(),
    clientName: clientName.trim(),
    clientWhatsapp: whatsapp,
  }

  let benefit: ActiveBenefit | null
  let recipient: string | null
  try {
    benefit = await dependencies.findActiveBenefit(normalized.offerId)
    if (!benefit) {
      return failure(404, 'Benefício não encontrado ou indisponível.')
    }
    recipient = await dependencies.findPublicEmail(benefit.authorId)
  } catch {
    console.error('[LEADS API] Benefit or profile lookup failed')
    return failure(500, 'Erro interno ao registrar o interesse. Tente novamente.')
  }

  const leadId = dependencies.createId()
  try {
    await dependencies.insertLead({
      id: leadId,
      ...normalized,
    })
  } catch {
    console.error('[LEADS API] Lead insert failed')
    return failure(500, 'Erro interno ao registrar o interesse. Tente novamente.')
  }

  const email = recipient?.trim()
  if (!email) {
    return {
      success: true,
      leadId,
      emailStatus: 'skipped_no_public_email',
    }
  }

  try {
    const result = await dependencies.sendNotification({
      id: leadId,
      recipient: email,
      benefitTitle: benefit.title,
      clientName: normalized.clientName,
      clientWhatsapp: normalized.clientWhatsapp,
    })
    return {
      success: true,
      leadId,
      emailStatus: result.sent ? 'sent' : 'failed',
    }
  } catch {
    console.error('[LEADS API] Notification delivery failed')
    return {
      success: true,
      leadId,
      emailStatus: 'failed',
    }
  }
}
