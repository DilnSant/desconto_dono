import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const disabledUrl = new URL('../src/lib/waitlist/disabled.ts', import.meta.url)
const routeUrl = new URL('../src/app/api/waitlist/route.ts', import.meta.url)
const schemaUrl = new URL('../supabase/schema_v4.sql', import.meta.url)
const baseSchemaUrl = new URL('../supabase/schema.sql', import.meta.url)

test('waitlist endpoint responds with 410 Gone for both methods', async () => {
  assert.ok(existsSync(disabledUrl), 'the disabled waitlist handler must exist')
  const { createWaitlistDisabledResponse } = await import('../src/lib/waitlist/disabled.ts')
  const route = readFileSync(routeUrl, 'utf8')

  assert.match(route, /export const GET = createWaitlistDisabledResponse/)
  assert.match(route, /export const POST = createWaitlistDisabledResponse/)

  for (const method of ['GET', 'POST']) {
    const response = createWaitlistDisabledResponse()
    assert.equal(response.status, 410, `${method} must return Gone`)
    assert.equal(response.headers.get('content-type'), 'application/json')
    assert.equal((await response.json()).code, 'WAITLIST_CLOSED')
  }
})

test('fresh schema does not create public waitlist policies', () => {
  const baseSchema = readFileSync(baseSchemaUrl, 'utf8')

  assert.equal(/CREATE POLICY[^;]*ON public\.waitlist/i.test(baseSchema), false)
})

test('migration revokes legacy public waitlist policies without deleting stored rows', () => {
  const schema = readFileSync(schemaUrl, 'utf8')

  assert.ok(schema.includes('DROP POLICY IF EXISTS "waitlist_public_insert" ON public.waitlist'))
  assert.ok(schema.includes('DROP POLICY IF EXISTS "waitlist_public_read" ON public.waitlist'))
  assert.doesNotMatch(schema, /DROP TABLE[^;]*public\.waitlist|TRUNCATE[^;]*public\.waitlist/i)
})
