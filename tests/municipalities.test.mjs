import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const lookupPath = new URL('../src/lib/geography/municipalities.ts', import.meta.url)
const routePath = new URL('../src/app/api/municipios/route.ts', import.meta.url)

function ibgeResponse(municipalities) {
  return new Response(JSON.stringify(municipalities), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function municipality(id, name, stateCode = 'SP') {
  return {
    id,
    nome: name,
    microrregiao: {
      mesorregiao: {
        UF: { sigla: stateCode },
      },
    },
  }
}

async function withFetch(fetchImplementation, callback) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = fetchImplementation
  try {
    await callback()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('searches municipalities without case or accent sensitivity and preserves IBGE identity', async () => {
  await withFetch(async () => ibgeResponse([
    municipality(3550308, 'São Paulo', 'SP'),
    municipality(3304557, 'Rio de Janeiro', 'RJ'),
  ]), async () => {
    const { searchMunicipalities } = await import(`${lookupPath.href}?case-search`)

    assert.deepEqual(await searchMunicipalities('SAO PAULO'), [
      { ibgeCode: '3550308', name: 'São Paulo', stateCode: 'SP' },
    ])
  })
})

test('returns no results for an empty query without requesting the IBGE catalog', async () => {
  let fetchCount = 0
  await withFetch(async () => {
    fetchCount += 1
    return ibgeResponse([])
  }, async () => {
    const { searchMunicipalities } = await import(`${lookupPath.href}?empty-query`)

    assert.deepEqual(await searchMunicipalities('  '), [])
    assert.equal(fetchCount, 0)
  })
})

test('rejects malformed official municipality responses', async () => {
  await withFetch(async () => ibgeResponse([{ id: 'not-an-ibge-code', nome: 'Cidade inválida' }]), async () => {
    const { searchMunicipalities } = await import(`${lookupPath.href}?malformed`)

    await assert.rejects(searchMunicipalities('cidade'), /Resposta inválida do IBGE/)
  })
})

test('returns a retryable service error when the IBGE catalog is unavailable', async () => {
  await withFetch(async () => {
    throw new Error('network unavailable')
  }, async () => {
    assert.ok(existsSync(routePath), 'Municipality route must exist')
    assert.match(readFileSync(routePath, 'utf8'), /handleMunicipalitySearchGet as GET/)
    const { handleMunicipalitySearchGet } = await import(`${lookupPath.href}?api-error`)
    const response = await handleMunicipalitySearchGet(new Request('http://localhost/api/municipios?q=sao'))

    assert.equal(response.status, 503)
    assert.match((await response.json()).error, /Tente novamente/)
  })
})

test('bounds route results and returns complete municipality identities', async () => {
  const catalog = Array.from({ length: 30 }, (_, index) =>
    municipality(3500000 + index, `Cidade ${index}`, 'SP'),
  )

  await withFetch(async () => ibgeResponse(catalog), async () => {
    assert.ok(existsSync(routePath), 'Municipality route must exist')
    assert.match(readFileSync(routePath, 'utf8'), /handleMunicipalitySearchGet as GET/)
    const { handleMunicipalitySearchGet } = await import(`${lookupPath.href}?api-success`)
    const response = await handleMunicipalitySearchGet(new Request('http://localhost/api/municipios?q=cidade'))
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.ok(body.municipalities.length <= 20)
    assert.deepEqual(body.municipalities[0], {
      ibgeCode: '3500000',
      name: 'Cidade 0',
      stateCode: 'SP',
    })
  })
})
