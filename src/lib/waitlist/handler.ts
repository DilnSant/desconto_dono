import type { EmailDeliveryResult } from '@/lib/email/resend'

type WaitlistInsert = {
  id: string
  full_name: string
  email: string
  city: string
  state: string
  category_id: string | null
  has_company: boolean
  accepted_terms: true
}

type WaitlistConfirmation = {
  id: string
  fullName: string
  email: string
  city: string
  state: string
}

type WaitlistPostDependencies = {
  createId: () => string
  insert: (input: WaitlistInsert) => Promise<{ errorCode?: string }>
  getCityPosition: (city: string, state: string) => Promise<number | null>
  sendConfirmation: (input: WaitlistConfirmation) => Promise<EmailDeliveryResult>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status })
}

export function createWaitlistPostHandler(dependencies: WaitlistPostDependencies) {
  return async function POST(request: Request): Promise<Response> {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: 'Dados inválidos' }, 400)
    }

    if (!isRecord(body)) {
      return jsonResponse({ error: 'Dados inválidos' }, 400)
    }

    const { full_name, email, city, state, category_id, has_company, accepted_terms } = body
    if (
      typeof full_name !== 'string' ||
      typeof email !== 'string' ||
      typeof city !== 'string' ||
      typeof state !== 'string' ||
      !full_name.trim() ||
      !email.trim() ||
      !city.trim() ||
      !state.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      !/^[a-z]{2}$/i.test(state.trim()) ||
      (category_id !== undefined && typeof category_id !== 'string') ||
      (has_company !== undefined && typeof has_company !== 'boolean')
    ) {
      return jsonResponse({ error: 'Campos obrigatórios inválidos' }, 400)
    }

    if (accepted_terms !== true) {
      return jsonResponse({ error: 'Aceite os termos para continuar' }, 400)
    }

    const normalized = {
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      category_id: typeof category_id === 'string' && category_id.trim() ? category_id.trim() : null,
      has_company: has_company === true,
    }
    const id = dependencies.createId()

    let insertResult: { errorCode?: string }
    try {
      insertResult = await dependencies.insert({
        id,
        ...normalized,
        accepted_terms: true,
      })
    } catch {
      console.error('[WAITLIST API] Database insert failed')
      return jsonResponse({ error: 'Erro interno. Tente novamente em instantes.' }, 500)
    }

    if (insertResult.errorCode === '23505') {
      return jsonResponse({ error: 'Este e-mail já está cadastrado na lista de espera.' }, 409)
    }
    if (insertResult.errorCode) {
      console.error('[WAITLIST API] Database insert failed')
      return jsonResponse({ error: 'Erro interno. Tente novamente em instantes.' }, 500)
    }

    let emailSent = false
    try {
      const emailResult = await dependencies.sendConfirmation({
        id,
        fullName: normalized.full_name,
        email: normalized.email,
        city: normalized.city,
        state: normalized.state,
      })
      emailSent = emailResult.sent
    } catch {
      console.error('[WAITLIST API] Confirmation delivery failed')
    }

    let position: number | null = null
    let notice: string | undefined
    try {
      position = await dependencies.getCityPosition(normalized.city, normalized.state)
      if (position === null) {
        notice = 'Não foi possível calcular sua posição na fila agora.'
      }
    } catch {
      console.error('[WAITLIST API] City position lookup failed')
      notice = 'Não foi possível calcular sua posição na fila agora.'
    }

    return jsonResponse(
      {
        success: true,
        id,
        position,
        city: normalized.city,
        emailSent,
        ...(notice ? { notice } : {}),
      },
      200
    )
  }
}
