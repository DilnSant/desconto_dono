import assert from 'node:assert/strict'
import test from 'node:test'

const origin = process.env.PROXY_TEST_ORIGIN ?? 'http://127.0.0.1:3000'

test('keeps public company profile routes out of the auth redirect', async () => {
  const response = await fetch(
    new URL('/perfil/00000000-0000-4000-8000-000000000000', origin),
    { redirect: 'manual' },
  )

  assert.notEqual(response.status, 307)
  assert.equal(response.headers.get('location'), null)
})

test('redirects the profile editor to login when no user is signed in', async () => {
  const response = await fetch(new URL('/perfil', origin), { redirect: 'manual' })

  assert.equal(response.status, 307)
  assert.equal(response.headers.get('location'), '/login?redirect=%2Fperfil')
})
