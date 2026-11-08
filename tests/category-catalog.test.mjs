import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { CATEGORIES_STATIC } from '../src/lib/constants/categories.ts'

const { parseCategoryCatalog, getSubcategoryCategoryLookup } = await import(
  new URL('../src/lib/categories/catalog.ts', import.meta.url)
)

test('parses database category and subcategory IDs while preserving their relationship', () => {
  const catalog = parseCategoryCatalog([{
    id: 'category-uuid',
    name: 'Serviços',
    subcategories: [{ id: 'subcategory-uuid', category_id: 'category-uuid', name: 'Limpeza' }],
  }])

  assert.deepEqual(catalog, [{
    id: 'category-uuid',
    name: 'Serviços',
    subcategories: [{ id: 'subcategory-uuid', category_id: 'category-uuid', name: 'Limpeza' }],
  }])
  assert.equal(getSubcategoryCategoryLookup(catalog).get('subcategory-uuid'), 'category-uuid')
})

test('rejects duplicate category and subcategory IDs in the database catalog', () => {
  const duplicateCategory = [
    { id: 'category-uuid', name: 'A', subcategories: [] },
    { id: 'category-uuid', name: 'B', subcategories: [] },
  ]
  const duplicateSubcategory = [{
    id: 'category-uuid',
    name: 'Serviços',
    subcategories: [
      { id: 'subcategory-uuid', category_id: 'category-uuid', name: 'Limpeza' },
      { id: 'subcategory-uuid', category_id: 'category-uuid', name: 'Higienização' },
    ],
  }]

  assert.equal(parseCategoryCatalog(duplicateCategory), null)
  assert.equal(parseCategoryCatalog(duplicateSubcategory), null)
})

test('rejects an empty category catalog instead of presenting unusable selectors', () => {
  assert.equal(parseCategoryCatalog([]), null)
})

test('provides service-provider trades as selectable Prestação de Serviços subcategories', () => {
  const services = CATEGORIES_STATIC.find(({ slug }) => slug === 'prestacao-de-servicos')
  const names = new Set(services?.subcategories.map(({ name }) => name))

  for (const name of ['Limpeza', 'Eletricista', 'Encanador', 'Pedreiro', 'Motorista', 'Manicure', 'Cuidadora de idosos', 'Pet sitter']) {
    assert.ok(names.has(name), `missing service subcategory: ${name}`)
  }
})

test('ships a repeatable migration for the existing Supabase category catalog', async () => {
  const migrationUrl = new URL('../supabase/schema_v5.sql', import.meta.url)
  assert.ok(existsSync(migrationUrl), 'existing Supabase projects need the v5 catalog migration')
  const migration = await readFile(migrationUrl, 'utf8')
  assert.match(migration, /ON CONFLICT\s*\(category_id,\s*slug\)\s+DO NOTHING/i)
  for (const slug of ['limpeza', 'eletricista', 'encanador', 'pedreiro', 'motorista', 'manicure', 'cuidadora-de-idosos', 'pet-sitter']) {
    assert.match(migration, new RegExp(`'${slug}'`))
  }
})

test('uses one custom select arrow so the browser does not draw a duplicate', async () => {
  const editor = await readFile(new URL('../src/components/profiles/ProfileSegmentsEditor.tsx', import.meta.url), 'utf8')
  assert.match(editor, /appearance-none/)
})
