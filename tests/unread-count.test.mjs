import assert from 'node:assert/strict'
import test from 'node:test'

const unreadCountModule = await import('../src/lib/messages/unread-count.ts').catch(() => null)
const getUnreadCount = unreadCountModule?.getUnreadCount
const getCurrentUnreadCount = unreadCountModule?.getCurrentUnreadCount

const createClient = (result) => {
  const filters = []
  const query = {
    select(columns, options) {
      assert.equal(columns, 'id')
      assert.deepEqual(options, { count: 'exact', head: true })
      return this
    },
    eq(column, value) {
      filters.push([column, value])
      return this
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject)
    },
  }
  return {
    client: { from: (table) => {
      assert.equal(table, 'messages')
      return query
    } },
    filters,
  }
}

test('returns the exact unread message count for the recipient', async () => {
  assert.equal(typeof getUnreadCount, 'function')
  const { client, filters } = createClient({ count: 4, error: null })

  assert.equal(await getUnreadCount(client, 'user-123'), 4)
  assert.deepEqual(filters, [['receiver_id', 'user-123'], ['is_read', false]])
})

test('returns zero when no unread messages exist', async () => {
  assert.equal(typeof getUnreadCount, 'function')
  const { client } = createClient({ count: 0, error: null })

  assert.equal(await getUnreadCount(client, 'user-123'), 0)
})

test('logs a failed count query and returns null', async () => {
  assert.equal(typeof getUnreadCount, 'function')
  const { client } = createClient({ count: null, error: new Error('query failed') })
  const originalConsoleError = console.error
  const loggedErrors = []
  console.error = (...args) => loggedErrors.push(args)

  try {
    assert.equal(await getUnreadCount(client, 'user-123'), null)
  } finally {
    console.error = originalConsoleError
  }

  assert.equal(loggedErrors.length, 1)
})

test('hides unread count when the user or matching count state is unavailable', () => {
  assert.equal(typeof getCurrentUnreadCount, 'function')
  assert.equal(getCurrentUnreadCount(null, undefined), null)
  assert.equal(getCurrentUnreadCount({ userId: 'old-user', count: 3 }, 'new-user'), null)
  assert.equal(getCurrentUnreadCount({ userId: 'user-123', count: 3 }, 'user-123'), 3)
})
