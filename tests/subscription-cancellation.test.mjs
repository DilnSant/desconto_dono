import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const moduleUrl = new URL('../src/lib/asaas/cancel-subscription.ts', import.meta.url)
const schema = readFileSync(new URL('../supabase/schema_v4.sql', import.meta.url), 'utf8')

async function loadCancellation() {
  return import(moduleUrl.href)
}

function subscription(overrides = {}) {
  return {
    id: 'local-subscription-id',
    asaasSubscriptionId: 'provider-subscription-id',
    status: 'ACTIVE',
    currentPeriodEnd: '2026-12-01T00:00:00.000Z',
    gracePeriodEndsAt: null,
    cancelAtPeriodEnd: false,
    ...overrides,
  }
}

function dependencies(overrides = {}) {
  const events = []
  return {
    events,
    findSubscription: async () => subscription(),
    cancelAtProvider: async () => { events.push('provider-cancel') },
    markCanceled: async () => { events.push('database-update'); return true },
    now: () => new Date('2026-11-04T12:00:00.000Z'),
    ...overrides,
  }
}

test('cancels provider recurrence first and preserves local paid-through date', async () => {
  const { cancelSubscription } = await loadCancellation()
  const deps = dependencies()

  const result = await cancelSubscription('owner-id', deps)

  assert.deepEqual(result, {
    success: true,
    alreadyCanceled: false,
    currentPeriodEnd: '2026-12-01T00:00:00.000Z',
    gracePeriodEndsAt: null,
  })
  assert.deepEqual(deps.events, ['provider-cancel', 'database-update'])
})

test('does not change local state when Asaas rejects cancellation', async () => {
  const { cancelSubscription } = await loadCancellation()
  const deps = dependencies({
    cancelAtProvider: async () => { throw new Error('provider unavailable') },
  })

  const result = await cancelSubscription('owner-id', deps)

  assert.equal(result.success, false)
  assert.equal(result.status, 502)
  assert.deepEqual(deps.events, [])
})

test('repeated cancellation is idempotent and does not call Asaas again', async () => {
  const { cancelSubscription } = await loadCancellation()
  const deps = dependencies({
    findSubscription: async () => subscription({ status: 'CANCELED', cancelAtPeriodEnd: true }),
  })

  const result = await cancelSubscription('owner-id', deps)

  assert.deepEqual(result, {
    success: true,
    alreadyCanceled: true,
    currentPeriodEnd: '2026-12-01T00:00:00.000Z',
    gracePeriodEndsAt: null,
  })
  assert.deepEqual(deps.events, [])
})

test('past-due cancellation keeps access through its existing grace deadline', async () => {
  const { cancelSubscription } = await loadCancellation()
  const deps = dependencies({
    findSubscription: async () => subscription({
      status: 'PAST_DUE',
      currentPeriodEnd: '2026-11-03T00:00:00.000Z',
      gracePeriodEndsAt: '2026-11-06T00:00:00.000Z',
    }),
  })

  const result = await cancelSubscription('owner-id', deps)

  assert.equal(result.success, true)
  assert.equal(result.gracePeriodEndsAt, '2026-11-06T00:00:00.000Z')
  assert.match(schema, /s\.status = 'CANCELED'[\s\S]{0,220}s\.grace_period_ends_at > statement_timestamp\(\)/)
  assert.match(schema, /WHEN next_status = 'CANCELED' THEN subscription_row\.grace_period_ends_at/)
})

test('does not send an Asaas cancellation for a pending checkout without a provider subscription', async () => {
  const { cancelSubscription } = await loadCancellation()
  const deps = dependencies({
    findSubscription: async () => subscription({ status: 'PENDING', asaasSubscriptionId: null }),
  })

  const result = await cancelSubscription('owner-id', deps)

  assert.equal(result.success, false)
  assert.equal(result.status, 409)
  assert.deepEqual(deps.events, [])
})
