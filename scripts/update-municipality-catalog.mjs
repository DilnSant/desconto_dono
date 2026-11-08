import { writeFile } from 'node:fs/promises'

const source = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'
const target = new URL('../src/lib/geography/municipalities.json', import.meta.url)
const response = await fetch(source, {
  headers: { Accept: 'application/json' },
  signal: AbortSignal.timeout(30_000),
})

if (!response.ok) throw new Error(`IBGE respondeu HTTP ${response.status}`)

const payload = await response.json()
if (!Array.isArray(payload) || payload.length < 5000) {
  throw new Error('O catálogo do IBGE está vazio ou incompleto; arquivo não atualizado.')
}

const municipalities = payload.map((item) => {
  const state = item?.['regiao-imediata']?.['regiao-intermediaria']?.UF
    ?? item?.microrregiao?.mesorregiao?.UF
  const record = {
    ibgeCode: String(item?.id ?? ''),
    name: typeof item?.nome === 'string' ? item.nome.trim() : '',
    stateCode: typeof state?.sigla === 'string' ? state.sigla.trim().toUpperCase() : '',
  }

  if (!/^\d{7}$/.test(record.ibgeCode) || !record.name || !/^[A-Z]{2}$/.test(record.stateCode)) {
    throw new Error(`Registro inválido no catálogo do IBGE: ${JSON.stringify(item)}`)
  }

  return record
})

const codes = new Set(municipalities.map(({ ibgeCode }) => ibgeCode))
if (codes.size !== municipalities.length) throw new Error('O catálogo contém códigos IBGE duplicados.')
if (new Set(municipalities.map(({ stateCode }) => stateCode)).size !== 27) {
  throw new Error('O catálogo não contém as 27 UFs; arquivo não atualizado.')
}

await writeFile(target, `${JSON.stringify(municipalities)}\n`)
console.log(`Atualizado ${target.pathname}: ${municipalities.length} municípios de 27 UFs.`)
