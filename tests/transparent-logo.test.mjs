import assert from 'node:assert/strict'
import test from 'node:test'

const origin = process.env.LOGO_TEST_ORIGIN ?? 'http://127.0.0.1:3000'
const logoPath = '/images/LogoTransp..png'
const iconPath = '/images/favicon.jpg'
const logoRoutes = ['/login', '/cadastro', '/recuperar-senha', '/atualizar-senha']

test('authentication pages use the transparent logo and the global icon uses its favicon asset', async () => {
  const loginResponse = await fetch(new URL('/login', origin))
  assert.equal(loginResponse.status, 200)
  const loginHtml = await loginResponse.text()
  assert.ok(
    new RegExp(
      `<link rel="icon" href="${iconPath.replaceAll('.', '\\.')}"(?:/?>)`
    ).test(loginHtml),
    `the global icon should reference ${iconPath}`
  )

  for (const route of logoRoutes) {
    const response = await fetch(new URL(route, origin))
    assert.equal(response.status, 200, `${route} should be publicly accessible`)

    const html = await response.text()
    assert.ok(
      html.includes(logoPath) || html.includes(encodeURIComponent(logoPath)),
      `${route} should reference ${logoPath}`
    )
  }
})
