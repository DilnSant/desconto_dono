export interface WaitlistInput {
  full_name: string
  email: string
  city: string
  state: string
  category_id: string | null
  has_company: boolean
  accepted_terms: true
}

export const BRAZILIAN_UF_CODES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

type WaitlistValidationResult =
  | { ok: true; value: WaitlistInput }
  | { ok: false; error: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const invalid = (error: string): WaitlistValidationResult => ({ ok: false, error })
const validStateCodes = new Set<string>(BRAZILIAN_UF_CODES)
const isUuid = (value: string) =>
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)

export function validateWaitlistPayload(input: unknown): WaitlistValidationResult {
  if (!isRecord(input)) return invalid('Dados inválidos.')

  const fullName = typeof input.full_name === 'string' ? input.full_name.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const city = typeof input.city === 'string' ? input.city.trim() : ''
  const state = typeof input.state === 'string' ? input.state.trim().toUpperCase() : ''
  const acceptedTerms = input.accepted_terms
  const hasCompany = input.has_company
  const categoryId = input.category_id
  const website = input.website

  if (!fullName || fullName.length > 120) {
    return invalid('Informe um nome com até 120 caracteres.')
  }
  if (
    !email
    || email.length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return invalid('Informe um e-mail válido.')
  }
  if (!city || city.length > 100) {
    return invalid('Informe uma cidade com até 100 caracteres.')
  }
  if (!validStateCodes.has(state)) {
    return invalid('Informe uma UF válida.')
  }
  if (acceptedTerms !== true) {
    return invalid('É necessário aceitar os termos para se inscrever.')
  }
  if (hasCompany !== undefined && typeof hasCompany !== 'boolean') {
    return invalid('O campo de empresa deve ser verdadeiro ou falso.')
  }
  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    if (
      typeof categoryId !== 'string'
      || !isUuid(categoryId)
    ) {
      return invalid('A categoria informada é inválida.')
    }
  }
  if (website !== undefined && typeof website !== 'string') {
    return invalid('Solicitação inválida.')
  }
  if (typeof website === 'string' && website.trim()) {
    return invalid('Solicitação inválida.')
  }

  return {
    ok: true,
    value: {
      full_name: fullName,
      email,
      city,
      state,
      category_id: typeof categoryId === 'string' && categoryId ? categoryId : null,
      has_company: typeof hasCompany === 'boolean' ? hasCompany : false,
      accepted_terms: true,
    },
  }
}
