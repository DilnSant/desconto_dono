import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const helperPath = new URL('../src/lib/profile/category-selection.ts', import.meta.url)

const loadHelpers = async () => {
  assert.ok(existsSync(helperPath), 'profile category selection helper should exist')
  return import(helperPath.href)
}

const parents = {
  'subcategory-a': 'category-a',
  'subcategory-a-2': 'category-a',
  'subcategory-b': 'category-b',
}

const selection = (overrides = {}) => ({
  categoryIds: ['category-a', 'category-b'],
  subcategoryIds: ['subcategory-a', 'subcategory-b'],
  primaryCategoryId: 'category-a',
  primarySubcategoryId: 'subcategory-a',
  ...overrides,
})

test('hydrates legacy single category fields when arrays are empty', async () => {
  const { hydrateCategorySelection } = await loadHelpers()

  assert.deepEqual(hydrateCategorySelection({
    category_ids: [],
    subcategory_ids: [],
    category_id: 'category-legacy',
    subcategory_id: 'subcategory-legacy',
  }), {
    categoryIds: ['category-legacy'],
    subcategoryIds: ['subcategory-legacy'],
    primaryCategoryId: 'category-legacy',
    primarySubcategoryId: 'subcategory-legacy',
  })
})

test('toggling categories preserves unrelated selections and chooses a deterministic primary', async () => {
  const { toggleCategory } = await loadHelpers()
  const initial = selection()

  const expanded = toggleCategory(initial, 'category-c', true, parents)
  assert.deepEqual(expanded.categoryIds, ['category-a', 'category-b', 'category-c'])
  assert.deepEqual(expanded.subcategoryIds, ['subcategory-a', 'subcategory-b'])

  const reduced = toggleCategory(expanded, 'category-a', false, parents)
  assert.deepEqual(reduced.categoryIds, ['category-b', 'category-c'])
  assert.deepEqual(reduced.subcategoryIds, ['subcategory-b'])
  assert.equal(reduced.primaryCategoryId, 'category-b')
  assert.equal(reduced.primarySubcategoryId, null)
  assert.deepEqual(initial.categoryIds, ['category-a', 'category-b'])
})

test('toggling subcategories keeps selection within selected categories', async () => {
  const { toggleSubcategory } = await loadHelpers()
  const initial = selection({ categoryIds: ['category-a'], subcategoryIds: ['subcategory-a'] })

  const added = toggleSubcategory(initial, 'subcategory-a-2', true, parents)
  assert.deepEqual(added.subcategoryIds, ['subcategory-a', 'subcategory-a-2'])

  const removed = toggleSubcategory(added, 'subcategory-a', false, parents)
  assert.deepEqual(removed.subcategoryIds, ['subcategory-a-2'])
  assert.equal(removed.primarySubcategoryId, null)

  const invalid = toggleSubcategory(initial, 'subcategory-b', true, parents)
  assert.deepEqual(invalid.subcategoryIds, ['subcategory-a'])
})

test('changing the primary category clears an incompatible primary subcategory', async () => {
  const { selectPrimaryCategory } = await loadHelpers()

  assert.equal(
    selectPrimaryCategory(selection(), 'category-b', parents).primarySubcategoryId,
    null
  )
})

test('primary subcategory must be selected and belong to the primary category', async () => {
  const { selectPrimarySubcategory } = await loadHelpers()
  const initial = selection({
    subcategoryIds: ['subcategory-a', 'subcategory-a-2', 'subcategory-b'],
  })

  assert.equal(
    selectPrimarySubcategory(initial, 'subcategory-a-2', parents).primarySubcategoryId,
    'subcategory-a-2'
  )
  assert.equal(
    selectPrimarySubcategory(initial, 'subcategory-b', parents).primarySubcategoryId,
    'subcategory-a'
  )
  assert.equal(
    selectPrimarySubcategory(initial, 'subcategory-not-selected', parents).primarySubcategoryId,
    'subcategory-a'
  )
})
