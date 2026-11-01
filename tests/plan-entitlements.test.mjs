import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const moduleUrl = new URL('../src/lib/plans/entitlements.ts', import.meta.url)

async function loadEntitlements() {
  assert.ok(existsSync(moduleUrl), 'Plan entitlement module must exist')
  return import(moduleUrl.href)
}

test('returns the exact entitlements for every selectable plan', async () => {
  const { getPlanEntitlements } = await loadEntitlements()

  assert.deepEqual(getPlanEntitlements('Gratuito'), {
    maxNewActiveListings: 1,
    maxMunicipalities: 1,
    allowsNationalCoverage: false,
    maxSegments: 1,
    maxSubcategories: 3,
    maxProfilePhotos: 0,
    publicContacts: false,
  })
  assert.deepEqual(getPlanEntitlements('Essencial'), {
    maxNewActiveListings: 3,
    maxMunicipalities: 3,
    allowsNationalCoverage: true,
    maxSegments: 2,
    maxSubcategories: 6,
    maxProfilePhotos: 3,
    publicContacts: true,
  })
  assert.deepEqual(getPlanEntitlements('Profissional'), {
    maxNewActiveListings: 5,
    maxMunicipalities: 5,
    allowsNationalCoverage: true,
    maxSegments: 3,
    maxSubcategories: 10,
    maxProfilePhotos: 10,
    publicContacts: true,
  })
})

test('normalizes the legacy Premium value to Gratuito', async () => {
  const { normalizeStoredPlanType } = await loadEntitlements()

  assert.equal(normalizeStoredPlanType('Premium'), 'Gratuito')
})

test('rejects unknown stored plan values rather than granting an entitlement', async () => {
  const { normalizeStoredPlanType } = await loadEntitlements()

  assert.throws(() => normalizeStoredPlanType('Enterprise'), /Unknown stored plan/)
})
