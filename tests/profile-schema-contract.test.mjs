import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('profile migration adds multi-select fields and backfills only empty arrays', () => {
  const schema = source('../supabase/schema_v4.sql')
  const normalizedSchema = schema.replace(/\s+/g, ' ')

  assert.match(normalizedSchema, /add column if not exists category_ids uuid\[\] not null default/i)
  assert.match(normalizedSchema, /add column if not exists subcategory_ids uuid\[\] not null default/i)
  assert.match(normalizedSchema, /add column if not exists primary_category_id uuid references public\.categories\(id\)/i)
  assert.match(normalizedSchema, /add column if not exists primary_subcategory_id uuid references public\.subcategories\(id\)/i)
  assert.match(normalizedSchema, /update public\.profiles set category_ids = array\[category_id\]/i)
  assert.match(normalizedSchema, /where cardinality\(category_ids\) = 0 and category_id is not null/i)
  assert.match(normalizedSchema, /update public\.profiles set subcategory_ids = array\[subcategory_id\]/i)
  assert.match(normalizedSchema, /where cardinality\(subcategory_ids\) = 0 and subcategory_id is not null/i)
  assert.doesNotMatch(normalizedSchema, /drop column .*?(category_id|subcategory_id)|rename column .*?(category_id|subcategory_id)/i)
})

test('profile row, insert, and update types include all multi-select fields', () => {
  const database = source('../src/types/database.ts')
  const profileTypes = database.match(/profiles:\s*\{([\s\S]*?)\n\s*\}\n\s*listings:/)?.[1]

  assert.ok(profileTypes, 'profile database types should exist')
  assert.equal([...profileTypes.matchAll(/\bcategory_ids: string\[\]/g)].length, 1)
  assert.equal([...profileTypes.matchAll(/\bcategory_ids\?: string\[\]/g)].length, 2)
  assert.equal([...profileTypes.matchAll(/\bsubcategory_ids: string\[\]/g)].length, 1)
  assert.equal([...profileTypes.matchAll(/\bsubcategory_ids\?: string\[\]/g)].length, 2)
  assert.equal([...profileTypes.matchAll(/\bprimary_category_id: string \| null/g)].length, 1)
  assert.equal([...profileTypes.matchAll(/\bprimary_category_id\?: string \| null/g)].length, 2)
  assert.equal([...profileTypes.matchAll(/\bprimary_subcategory_id: string \| null/g)].length, 1)
  assert.equal([...profileTypes.matchAll(/\bprimary_subcategory_id\?: string \| null/g)].length, 2)
})
