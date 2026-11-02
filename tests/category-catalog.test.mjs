import assert from 'node:assert/strict'
import test from 'node:test'

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
