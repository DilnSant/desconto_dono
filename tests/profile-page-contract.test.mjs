import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const page = readFileSync(new URL('../src/app/perfil/page.tsx', import.meta.url), 'utf8')

test('loads the authenticated profile and live category relationships', () => {
  assert.match(page, /(?:supabase|db)\.from\('profiles'\)/)
  assert.match(page, /\.eq\('id', user\.id\)/)
  assert.match(page, /(?:supabase|db)\.from\('categories'\)/)
  assert.match(page, /(?:supabase|db)\.from\('subcategories'\)/)
  assert.match(page, /hydrateCategorySelection/)
  assert.doesNotMatch(page, /CATEGORIES_STATIC/)
})

test('renders multi-select checkboxes and primary category radios', () => {
  assert.match(page, /type="checkbox"/)
  assert.match(page, /type="radio"/)
  assert.match(page, /selectPrimaryCategory/)
  assert.match(page, /selectPrimarySubcategory/)
})

test('saves selected arrays, primary IDs, and legacy singleton IDs together', () => {
  assert.match(page, /category_ids:\s*categorySelection\.categoryIds/)
  assert.match(page, /subcategory_ids:\s*categorySelection\.subcategoryIds/)
  assert.match(page, /primary_category_id:\s*categorySelection\.primaryCategoryId/)
  assert.match(page, /primary_subcategory_id:\s*categorySelection\.primarySubcategoryId/)
  assert.match(page, /category_id:\s*categorySelection\.primaryCategoryId/)
  assert.match(page, /subcategory_id:\s*categorySelection\.primarySubcategoryId/)
})

test('keeps load, upload, and save failures visible instead of showing an empty form', () => {
  assert.match(page, /role="alert"/)
  assert.match(page, /if \(!profile\)/)
  assert.match(page, /Não foi possível carregar/)
  assert.match(page, /Não foi possível enviar/)
  assert.match(page, /Não foi possível salvar/)
})
