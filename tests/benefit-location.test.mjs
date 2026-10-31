import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const helperPath = new URL('../src/lib/benefits/location.ts', import.meta.url)

const loadNormalizer = async () => {
  assert.ok(existsSync(helperPath), 'benefit location helper should exist')
  const { normalizeBenefitLocation } = await import(helperPath.href)
  return normalizeBenefitLocation
}

test('trims city and uppercases the state abbreviation', async () => {
  const normalizeBenefitLocation = await loadNormalizer()

  assert.deepEqual(normalizeBenefitLocation('  Curitiba  ', ' pr '), {
    location_city: 'Curitiba',
    location_state: 'PR',
  })
})

test('normalizes blank optional location values to null', async () => {
  const normalizeBenefitLocation = await loadNormalizer()

  assert.deepEqual(normalizeBenefitLocation('  ', ''), {
    location_city: null,
    location_state: null,
  })
})
