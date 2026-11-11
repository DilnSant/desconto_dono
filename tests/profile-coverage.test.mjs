import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const moduleUrl = new URL('../src/lib/profiles/coverage.ts', import.meta.url)

async function loadCoverage() {
  assert.ok(existsSync(moduleUrl), 'Profile coverage validation module must exist')
  return import(moduleUrl.href)
}

function municipalities(count) {
  return Array.from({ length: count }, (_, index) => ({
    ibgeCode: String(1000000 + index),
    name: `Cidade ${index}`,
    stateCode: 'SP',
  }))
}

function segmentSelection(segmentCount, subcategoryCount) {
  const segments = Array.from({ length: segmentCount }, (_, index) => ({
    categoryId: `category-${index}`,
    subcategoryIds: [],
    isPrimary: index === 0,
  }))
  const subcategoryCategoryById = new Map()

  for (let index = 0; index < subcategoryCount; index += 1) {
    const segment = segments[index % segmentCount]
    const subcategoryId = `subcategory-${index}`
    segment.subcategoryIds.push(subcategoryId)
    subcategoryCategoryById.set(subcategoryId, segment.categoryId)
  }

  return { selection: { segments }, subcategoryCategoryById }
}

test('enforces municipality limits of one, three, and five by plan', async () => {
  const { validateCoverageSelection } = await loadCoverage()

  for (const [plan, limit] of [
    ['Gratuito', 1],
    ['Essencial', 3],
    ['Profissional', 5],
  ]) {
    assert.equal(validateCoverageSelection(plan, {
      scope: 'municipalities',
      municipalities: municipalities(limit),
    }).valid, true)
    assert.equal(validateCoverageSelection(plan, {
      scope: 'municipalities',
      municipalities: municipalities(limit + 1),
    }).valid, false)
  }
})

test('rejects duplicate municipality codes', async () => {
  const { validateCoverageSelection } = await loadCoverage()
  const [municipality] = municipalities(1)

  const result = validateCoverageSelection('Essencial', {
    scope: 'municipalities',
    municipalities: [municipality, municipality],
  })

  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => /duplicado/i.test(error)))
})

test('requires paid plan eligibility and non-presential declaration for national coverage', async () => {
  const { validateCoverageSelection } = await loadCoverage()

  assert.equal(validateCoverageSelection('Gratuito', {
    scope: 'national',
    declaredNonPresential: true,
  }).valid, false)
  assert.equal(validateCoverageSelection('Essencial', {
    scope: 'national',
    declaredNonPresential: false,
  }).valid, false)
  assert.equal(validateCoverageSelection('Essencial', {
    scope: 'national',
    declaredNonPresential: true,
  }).valid, true)
})

test('enforces segment and total subcategory caps for every plan', async () => {
  const { validateProfileSegments } = await loadCoverage()

  for (const [plan, segments, subcategories] of [
    ['Gratuito', 1, 3],
    ['Essencial', 2, 6],
    ['Profissional', 3, 10],
  ]) {
    const validSelection = segmentSelection(segments, subcategories)
    assert.equal(
      validateProfileSegments(plan, validSelection.selection, validSelection.subcategoryCategoryById).valid,
      true,
    )

    const excessSegments = segmentSelection(segments + 1, subcategories)
    assert.equal(
      validateProfileSegments(plan, excessSegments.selection, excessSegments.subcategoryCategoryById).valid,
      false,
    )

    const excessSubcategories = segmentSelection(segments, subcategories + 1)
    assert.equal(
      validateProfileSegments(plan, excessSubcategories.selection, excessSubcategories.subcategoryCategoryById).valid,
      false,
    )
  }
})

test('rejects a subcategory that belongs to a different selected segment', async () => {
  const { validateProfileSegments } = await loadCoverage()
  const selection = {
    segments: [
      { categoryId: 'category-a', subcategoryIds: ['subcategory-b'], isPrimary: true },
      { categoryId: 'category-b', subcategoryIds: [], isPrimary: false },
    ],
  }

  const result = validateProfileSegments(
    'Essencial',
    selection,
    new Map([['subcategory-b', 'category-b']]),
  )

  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => /pertence/i.test(error)))
})

test('allows each segment to target commercial, residential, or both audiences', async () => {
  const { validateProfileSegments } = await loadCoverage()
  const subcategoryCategoryById = new Map()

  for (const serviceAudiences of [
    ['commercial'],
    ['residential'],
    ['commercial', 'residential'],
  ]) {
    const result = validateProfileSegments('Profissional', {
      segments: [{
        categoryId: `category-${serviceAudiences.join('-')}`,
        subcategoryIds: [],
        isPrimary: true,
        serviceAudiences,
      }],
    }, subcategoryCategoryById)
    assert.equal(result.valid, true, `${serviceAudiences.join('+')} should be valid`)
  }
})

test('requires at least one valid audience for every segment', async () => {
  const { validateProfileSegments } = await loadCoverage()

  for (const serviceAudiences of [[], ['commercial', 'commercial'], ['other']]) {
    const result = validateProfileSegments('Gratuito', {
      segments: [{ categoryId: 'category-a', subcategoryIds: [], isPrimary: true, serviceAudiences }],
    }, new Map())
    assert.equal(result.valid, false)
    assert.ok(result.errors.some((error) => /Comercial, Residencial/i.test(error)))
  }
})
