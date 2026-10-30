import assert from 'node:assert/strict'
import test from 'node:test'

const origin = process.env.OAUTH_TEST_ORIGIN ?? 'http://127.0.0.1:3000'

test('renders the OAuth error from the query string in the initial response', async () => {
  const response = await fetch(new URL('/login?erro=oauth', origin))
  assert.equal(response.status, 200)

  const html = await response.text()
  assert.ok(html.includes('Falha ao autenticar com Google. Tente novamente.'))
})
