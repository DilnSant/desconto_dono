import municipalityCatalog from './municipalities.json' with { type: 'json' }

export interface Municipality {
  ibgeCode: string
  name: string
  stateCode: string
}

export const MUNICIPALITY_RESULT_LIMIT = 20

const catalog = municipalityCatalog as Municipality[]

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
}

export async function searchMunicipalities(query: string, stateCode?: string): Promise<Municipality[]> {
  const normalizedQuery = normalizeSearchText(query.trim())
  const normalizedState = stateCode?.trim().toUpperCase()
  if (!normalizedQuery && !normalizedState) return []

  return catalog
    .filter((municipality) => {
      if (normalizedState && municipality.stateCode !== normalizedState) return false
      if (!normalizedQuery) return true

      return [
        normalizeSearchText(municipality.name),
        municipality.stateCode.toLocaleLowerCase('pt-BR'),
        municipality.ibgeCode,
      ].some((field) => field.includes(normalizedQuery))
    })
    .slice(0, MUNICIPALITY_RESULT_LIMIT)
}

export async function handleMunicipalitySearchGet(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() ?? ''
  const stateCode = url.searchParams.get('state')?.trim() ?? ''

  if (query.length > 100) {
    return Response.json({ error: 'A busca deve ter até 100 caracteres.' }, { status: 400 })
  }

  const municipalities = await searchMunicipalities(query, stateCode)
  return Response.json(
    { municipalities },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
  )
}
