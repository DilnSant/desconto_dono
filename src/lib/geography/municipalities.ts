export interface Municipality {
  ibgeCode: string
  name: string
  stateCode: string
}

const IBGE_MUNICIPALITIES_URL =
  'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000
export const MUNICIPALITY_RESULT_LIMIT = 20

let cachedMunicipalities: Municipality[] | null = null
let cacheExpiresAt = 0
let catalogRequest: Promise<Municipality[]> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stateFromPath(
  municipality: Record<string, unknown>,
  path: string[],
): Record<string, unknown> | null {
  let value: unknown = municipality
  for (const key of path) {
    if (!isRecord(value)) return null
    value = value[key]
  }
  return isRecord(value) ? value : null
}

function parseMunicipalityCatalog(payload: unknown): Municipality[] {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Resposta inválida do IBGE')
  }

  return payload.map((value) => {
    if (!isRecord(value)) throw new Error('Resposta inválida do IBGE')

    const ibgeCode =
      typeof value.id === 'number' || typeof value.id === 'string'
        ? String(value.id)
        : ''
    const name = typeof value.nome === 'string' ? value.nome.trim() : ''
    const state =
      stateFromPath(value, ['regiao-imediata', 'regiao-intermediaria', 'UF']) ??
      stateFromPath(value, ['microrregiao', 'mesorregiao', 'UF'])
    const stateCode = typeof state?.sigla === 'string' ? state.sigla.trim().toUpperCase() : ''

    if (!/^\d{7}$/.test(ibgeCode) || !name || !/^[A-Z]{2}$/.test(stateCode)) {
      throw new Error('Resposta inválida do IBGE')
    }

    return { ibgeCode, name, stateCode }
  })
}

async function loadMunicipalityCatalog(): Promise<Municipality[]> {
  if (cachedMunicipalities && Date.now() < cacheExpiresAt) {
    return cachedMunicipalities
  }
  if (catalogRequest) return catalogRequest

  catalogRequest = (async () => {
    const response = await fetch(IBGE_MUNICIPALITIES_URL, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`Falha ao consultar o IBGE (HTTP ${response.status})`)
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch (error) {
      throw new Error('Resposta inválida do IBGE', { cause: error })
    }

    const municipalities = parseMunicipalityCatalog(payload)
    cachedMunicipalities = municipalities
    cacheExpiresAt = Date.now() + CACHE_DURATION_MS
    return municipalities
  })()

  try {
    return await catalogRequest
  } finally {
    catalogRequest = null
  }
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
}

export async function searchMunicipalities(query: string, stateCode?: string): Promise<Municipality[]> {
  const normalizedQuery = normalizeSearchText(query.trim())
  const normalizedState = stateCode?.trim().toUpperCase()

  const municipalities = await loadMunicipalityCatalog()

  return municipalities
    .filter((municipality) => {
      const matchesState = !normalizedState || municipality.stateCode === normalizedState

      // If query is empty but state is provided, return all municipalities for that state
      if (!normalizedQuery) return matchesState

      const matchesQuery = [
        normalizeSearchText(municipality.name),
        municipality.stateCode.toLocaleLowerCase('pt-BR'),
        municipality.ibgeCode,
      ].some((field) => field.includes(normalizedQuery))

      return matchesState && matchesQuery
    })
    .slice(0, MUNICIPALITY_RESULT_LIMIT)
}

function isValidQuery(query: string): boolean {
  return query.length <= 100
}

export async function handleMunicipalitySearchGet(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() ?? ''
  const stateCode = url.searchParams.get('state')?.trim() ?? ''

  if (!isValidQuery(query)) {
    return Response.json({ error: 'A busca deve ter até 100 caracteres.' }, { status: 400 })
  }

  try {
    const municipalities = await searchMunicipalities(query, stateCode)
    return Response.json(
      { municipalities },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
    )
  } catch (error) {
    console.error('[MUNICÍPIOS API] Falha ao consultar o catálogo oficial do IBGE', error)
    return Response.json(
      { error: 'Não foi possível carregar os municípios agora. Tente novamente.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
