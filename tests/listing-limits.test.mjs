import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const moduleUrl = new URL('../src/lib/plans/listing-limits.ts', import.meta.url)
const schemaUrl = new URL('../supabase/schema_v4.sql', import.meta.url)

async function loadListingLimits() {
  assert.ok(existsSync(moduleUrl), 'Listing limits module must exist')
  return import(moduleUrl.href)
}

test('counts only active non-grandfathered listings against new-ad quotas', async () => {
  const { getCountableActiveListingCount } = await loadListingLimits()

  assert.equal(getCountableActiveListingCount([
    { is_active: true, grandfathered: true },
    { is_active: true, grandfathered: false },
    { is_active: false, grandfathered: false },
    { is_active: false, grandfathered: true },
  ]), 1)
})

test('applies new active listing limits of one, three, and five', async () => {
  const { canCreateNewActiveListing } = await loadListingLimits()

  for (const [plan, limit] of [
    ['Gratuito', 1],
    ['Essencial', 3],
    ['Profissional', 5],
  ]) {
    assert.equal(canCreateNewActiveListing(plan, limit - 1), true)
    assert.equal(canCreateNewActiveListing(plan, limit), false)
  }
})

test('an inactive non-grandfathered legacy listing consumes a slot when reactivated', async () => {
  const { getCountableActiveListingCount } = await loadListingLimits()
  const legacyListing = { is_active: false, grandfathered: false }

  assert.equal(getCountableActiveListingCount([legacyListing]), 0)
  assert.equal(getCountableActiveListingCount([{ ...legacyListing, is_active: true }]), 1)
})

test('database rejects client changes to grandfathered listing status', () => {
  assert.ok(existsSync(schemaUrl), 'Schema v4 migration must exist')
  const sql = readFileSync(schemaUrl, 'utf8')
  const listingTrigger = sql.match(
    /CREATE OR REPLACE FUNCTION public\.enforce_listing_entitlement[\s\S]*?\n\$\$;/i,
  )?.[0]

  assert.ok(listingTrigger, 'Listing entitlement trigger must exist')
  assert.match(listingTrigger, /auth\.uid\(\)\s+IS NOT NULL[\s\S]*?NEW\.grandfathered\s+IS DISTINCT FROM OLD\.grandfathered/i)
  assert.match(listingTrigger, /Grandfathered listing state is managed by the platform/)
})
