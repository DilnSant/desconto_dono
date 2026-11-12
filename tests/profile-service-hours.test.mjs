import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const { createEmptyServiceHours, getPublicServiceHours, hydrateServiceHours, serializeServiceHours, validateServiceHours } =
  await import('../src/lib/profiles/service-hours.ts')

test('hydrates missing or partial weekly hours safely', () => {
  const empty = hydrateServiceHours(null)
  assert.equal(empty.monday.open, '')
  assert.equal(empty.sunday.closed, false)

  const partial = hydrateServiceHours({ monday: { open: '09:00', close: '17:30' }, sunday: { closed: true } })
  assert.deepEqual(partial.monday, { open: '09:00', close: '17:30', closed: false })
  assert.deepEqual(partial.sunday, { open: '', close: '', closed: true })
  assert.deepEqual(partial.tuesday, { open: '', close: '', closed: false })
})

test('validates complete and ordered opening hours while allowing closed or unspecified days', () => {
  const hours = createEmptyServiceHours()
  hours.monday = { open: '09:00', close: '18:00', closed: false }
  hours.sunday = { open: '', close: '', closed: true }
  assert.equal(validateServiceHours(hours), null)

  hours.tuesday = { open: '09:00', close: '', closed: false }
  assert.match(validateServiceHours(hours), /Terça-feira/)
  hours.tuesday = { open: '18:00', close: '09:00', closed: false }
  assert.match(validateServiceHours(hours), /depois da abertura/)
})

test('saves weekly hours and publishes only configured or explicitly closed days', () => {
  const hours = createEmptyServiceHours()
  hours.monday = { open: '09:00', close: '18:00', closed: false }
  hours.sunday = { open: '', close: '', closed: true }
  const stored = serializeServiceHours(hours)

  assert.deepEqual(stored, {
    monday: { open: '09:00', close: '18:00', closed: false },
    sunday: { closed: true },
  })
  assert.deepEqual(getPublicServiceHours(stored).map(({ key, closed, open, close }) => ({ key, closed, open, close })), [
    { key: 'monday', closed: false, open: '09:00', close: '18:00' },
    { key: 'sunday', closed: true, open: null, close: null },
  ])
})

test('saves and publishes 24-hour service days correctly', () => {
  const hours = createEmptyServiceHours()
  hours.friday = { open: '00:00', close: '23:59', closed: false, allDay: true }
  assert.equal(validateServiceHours(hours), null)

  const stored = serializeServiceHours(hours)
  assert.deepEqual(stored, {
    friday: { allDay: true, open: '00:00', close: '23:59', closed: false },
  })

  const publicHours = getPublicServiceHours(stored)
  assert.deepEqual(publicHours, [
    { key: 'friday', label: 'Sexta-feira', open: '00:00', close: '23:59', closed: false, allDay: true },
  ])
})

test('database migration persists both fields and adds them to the public profile projection', async () => {
  const migration = await readFile(new URL('../supabase/schema_v6.sql', import.meta.url), 'utf8')
  assert.match(migration, /service_audiences text\[\][\s\S]*?DEFAULT ARRAY\['commercial', 'residential'\]/)
  assert.match(migration, /CHECK \([\s\S]*?cardinality\(service_audiences\) BETWEEN 1 AND 2/)
  assert.match(migration, /service_hours jsonb NOT NULL DEFAULT '\{\}'::jsonb/)
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.save_profile_coverage_with_audiences/)
  assert.match(migration, /SET service_audiences = v_service_audiences/)
  assert.match(migration, /service_hours = COALESCE\(p_service_hours, p\.service_hours\)/)
  assert.match(migration, /p\.service_hours,/)
  assert.match(migration, /'service_audiences', visible\.service_audiences/)
})
