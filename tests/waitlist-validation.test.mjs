import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const helperPath = new URL('../src/lib/waitlist/validation.ts', import.meta.url)

const validPayload = () => ({
  full_name: '  Ana Souza  ',
  email: '  ANA@EXAMPLE.COM ',
  city: '  Curitiba  ',
  state: ' pr ',
  category_id: 'a53bc58c-21bf-40cc-bba2-595c335a6b60',
  has_company: true,
  accepted_terms: true,
  website: '',
  ignored_field: 'must not be forwarded',
})

const loadValidator = async () => {
  assert.ok(existsSync(helperPath), 'waitlist validator should exist')
  const { validateWaitlistPayload } = await import(helperPath.href)
  return validateWaitlistPayload
}

test('normalizes valid contact fields and returns only supported fields', async () => {
  const validateWaitlistPayload = await loadValidator()

  assert.deepEqual(validateWaitlistPayload(validPayload()), {
    ok: true,
    value: {
      full_name: 'Ana Souza',
      email: 'ana@example.com',
      city: 'Curitiba',
      state: 'PR',
      category_id: 'a53bc58c-21bf-40cc-bba2-595c335a6b60',
      has_company: true,
      accepted_terms: true,
    },
  })
})

test('rejects missing required fields, invalid email, and malformed state', async () => {
  const validateWaitlistPayload = await loadValidator()
  const missingEmail = validPayload()
  delete missingEmail.email
  const cases = [
    missingEmail,
    { ...validPayload(), full_name: '  ' },
    { ...validPayload(), email: 'not-an-email' },
    { ...validPayload(), state: 'P' },
    { ...validPayload(), state: 'SP1' },
    { ...validPayload(), city: '' },
    { ...validPayload(), category_id: 'not-a-uuid' },
  ]

  for (const payload of cases) {
    assert.equal(validateWaitlistPayload(payload).ok, false)
  }
})

test('accepts the category UUID format used by the waitlist form', async () => {
  const validateWaitlistPayload = await loadValidator()

  const result = validateWaitlistPayload({
    ...validPayload(),
    category_id: '11111111-0001-0001-0001-000000000001',
  })

  assert.equal(result.ok, true)
})

test('rejects unknown two-letter state codes', async () => {
  const validateWaitlistPayload = await loadValidator()

  assert.equal(validateWaitlistPayload({
    ...validPayload(),
    state: 'ZZ',
  }).ok, false)
})

test('rejects non-object payloads and incorrect field types', async () => {
  const validateWaitlistPayload = await loadValidator()

  for (const payload of [null, [], 'payload', 42]) {
    assert.equal(validateWaitlistPayload(payload).ok, false)
  }

  for (const payload of [
    { ...validPayload(), email: 123 },
    { ...validPayload(), has_company: 'yes' },
    { ...validPayload(), category_id: 3 },
    { ...validPayload(), website: 4 },
  ]) {
    assert.equal(validateWaitlistPayload(payload).ok, false)
  }
})

test('rejects oversized fields and unaccepted terms', async () => {
  const validateWaitlistPayload = await loadValidator()

  assert.equal(validateWaitlistPayload({
    ...validPayload(),
    full_name: 'a'.repeat(121),
  }).ok, false)
  assert.equal(validateWaitlistPayload({
    ...validPayload(),
    email: `${'a'.repeat(243)}@example.com`,
  }).ok, false)
  assert.equal(validateWaitlistPayload({
    ...validPayload(),
    city: 'a'.repeat(101),
  }).ok, false)
  assert.equal(validateWaitlistPayload({
    ...validPayload(),
    accepted_terms: false,
  }).ok, false)
})

test('rejects a filled honeypot without returning a successful value', async () => {
  const validateWaitlistPayload = await loadValidator()

  assert.equal(validateWaitlistPayload({
    ...validPayload(),
    website: 'https://spam.example',
  }).ok, false)
})
