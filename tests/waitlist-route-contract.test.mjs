import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const route = readFileSync(
  new URL('../src/app/api/waitlist/route.ts', import.meta.url),
  'utf8'
)
const sql = readFileSync(new URL('../supabase/schema_v4.sql', import.meta.url), 'utf8')

test('revokes direct waitlist reads and exposes only accepted inserts and city aggregates', () => {
  assert.match(sql, /DROP POLICY IF EXISTS "waitlist_public_read" ON public\.waitlist/i)
  assert.match(
    sql,
    /REVOKE ALL ON TABLE public\.waitlist FROM PUBLIC, anon, authenticated/i
  )
  assert.match(sql, /GRANT INSERT ON TABLE public\.waitlist TO anon, authenticated/i)
  assert.match(
    sql,
    /CREATE POLICY "waitlist_public_insert"\s+ON public\.waitlist\s+FOR INSERT\s+TO anon, authenticated\s+WITH CHECK \(accepted_terms IS TRUE\)/i
  )
  assert.match(
    sql,
    /GRANT SELECT ON TABLE public\.cities_ranking TO anon, authenticated/i
  )
})

test('validates input, inserts without selecting personal data, and sends mail only after insertion', () => {
  assert.match(route, /validateWaitlistPayload/)
  assert.match(route, /randomUUID\(\)/)
  assert.match(route, /\.code === '23505'/)
  assert.match(route, /status: 409/)

  const insertStart = route.indexOf('.insert(')
  const insertErrorCheck = route.indexOf('if (insertError)', insertStart)
  assert.ok(insertStart >= 0)
  assert.ok(insertErrorCheck > insertStart)
  assert.doesNotMatch(route.slice(insertStart, insertErrorCheck), /\.select\(/)

  const emailSend = route.indexOf('await sendWaitlistConfirmation(')
  assert.ok(emailSend > insertErrorCheck)
})

test('returns explicit registration and email status without hiding ranking failures', () => {
  assert.match(route, /emailSent/)
  assert.match(route, /let position: number \| null = null/)
  assert.match(route, /status:\s*201/)
  assert.match(route, /status:\s*500/)
  assert.doesNotMatch(route, /ranking:\s*data\s*\|\|\s*\[\]/)
})
