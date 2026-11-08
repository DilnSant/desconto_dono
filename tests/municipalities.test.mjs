import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const lookupPath = new URL('../src/lib/geography/municipalities.ts', import.meta.url)
const routePath = new URL('../src/app/api/municipios/route.ts', import.meta.url)

test('returns official city results from the local catalog when IBGE is unreachable', async () => {
  const originalFetch = globalThis.fetch
  let fetchCount = 0
  globalThis.fetch = async () => {
    fetchCount += 1
    throw new Error('IBGE is temporarily unavailable')
  }

  try {
    const { searchMunicipalities } = await import(`${lookupPath.href}?local-catalog`)
    assert.deepEqual(await searchMunicipalities('abdon', 'SC'), [
      { ibgeCode: '4200051', name: 'Abdon Batista', stateCode: 'SC' },
    ])
    assert.equal(fetchCount, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('searches with accent and case normalization and scopes to the selected state', async () => {
  const { searchMunicipalities } = await import(`${lookupPath.href}?accent-search`)

  const matches = await searchMunicipalities('sao jose', 'SC')
  assert.ok(matches.some((municipality) => municipality.ibgeCode === '4216602' && municipality.name === 'São José'))
  assert.deepEqual(await searchMunicipalities('sao jose', 'AM'), [])
})

test('returns up to 20 official municipalities for a selected state', async () => {
  const { searchMunicipalities, MUNICIPALITY_RESULT_LIMIT } = await import(`${lookupPath.href}?state-results`)

  const results = await searchMunicipalities('', 'SC')
  assert.equal(results.length, MUNICIPALITY_RESULT_LIMIT)
  assert.ok(results.every(({ stateCode, ibgeCode }) => stateCode === 'SC' && /^\d{7}$/.test(ibgeCode)))
})

test('serves city choices through the API without a network dependency', async () => {
  const route = await readFile(routePath, 'utf8')
  assert.match(route, /handleMunicipalitySearchGet as GET/)

  const { handleMunicipalitySearchGet } = await import(`${lookupPath.href}?route`)
  const response = await handleMunicipalitySearchGet(new Request('http://localhost/api/municipios?state=SC'))
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'public, max-age=300, stale-while-revalidate=3600')
  assert.equal(body.municipalities[0].name, 'Abdon Batista')
  assert.equal(body.municipalities[0].stateCode, 'SC')
})

test('returns no results for empty search without a state and rejects oversized queries', async () => {
  const { handleMunicipalitySearchGet } = await import(`${lookupPath.href}?validation`)
  const empty = await handleMunicipalitySearchGet(new Request('http://localhost/api/municipios'))
  const invalid = await handleMunicipalitySearchGet(new Request(`http://localhost/api/municipios?q=${'a'.repeat(101)}`))

  assert.deepEqual((await empty.json()).municipalities, [])
  assert.equal(invalid.status, 400)
})

test('bundled catalog contains every Brazilian state and the complete IBGE dataset', async () => {
  const catalog = JSON.parse(await readFile(new URL('../src/lib/geography/municipalities.json', import.meta.url)))
  const stateCodes = new Set(catalog.map(({ stateCode }) => stateCode))

  assert.equal(catalog.length, 5571)
  assert.equal(stateCodes.size, 27)
  assert.ok(catalog.every(({ ibgeCode, name }) => /^\d{7}$/.test(ibgeCode) && name))
})
