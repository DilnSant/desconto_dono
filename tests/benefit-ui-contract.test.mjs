import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const source = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('only fictional benefits are marked as examples and disabled', () => {
  const page = source('../src/app/beneficios/page.tsx')
  const feed = source('../src/app/beneficios/BeneficiosFeed.tsx')
  const mockBenefits = page.match(/const MOCK_BENEFITS = \[([\s\S]*?)\n\]/)?.[1]

  assert.ok(mockBenefits, 'mock benefits array should exist')
  assert.equal([...mockBenefits.matchAll(/\bis_example:\s*true/g)].length, 6)
  assert.match(feed, /disabled=\{benefit\.is_example === true\}/)
  assert.match(feed, /disabled:opacity-50/)
})

test('benefits can display an optional location', () => {
  const feed = source('../src/app/beneficios/BeneficiosFeed.tsx')

  assert.match(feed, /location_city/)
  assert.match(feed, /location_state/)
})

test('benefit location columns are nullable and represented in database types', () => {
  const schemaPath = new URL('../supabase/schema_v4.sql', import.meta.url)
  assert.ok(existsSync(schemaPath), 'benefit schema migration should exist')

  const schema = readFileSync(schemaPath, 'utf8')
  const database = source('../src/types/database.ts')
  const benefitTypes = database.match(/benefits:\s*\{([\s\S]*?)\n\s*\}\n\s*\}/)?.[1]

  assert.ok(benefitTypes, 'benefit database types should exist')
  assert.match(schema, /add column if not exists location_city text/i)
  assert.match(schema, /add column if not exists location_state text/i)
  assert.match(benefitTypes, /location_city: string \| null/)
  assert.match(benefitTypes, /location_state: string \| null/)
  assert.match(benefitTypes, /location_city\?: string \| null/)
  assert.match(benefitTypes, /location_state\?: string \| null/)
})

test('benefit form normalizes and persists optional city and state', () => {
  const form = source('../src/app/beneficios/novo/page.tsx')

  assert.match(form, /normalizeBenefitLocation/)
  assert.match(form, /location_city/)
  assert.match(form, /location_state/)
  assert.match(form, /id="b-city"/)
  assert.match(form, /id="b-state"/)
})
