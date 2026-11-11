import assert from 'node:assert/strict'
import test from 'node:test'

const { getCheckoutCallbackUrls } = await import('../src/lib/asaas/callback-urls.ts')

test('uses the configured app origin for hosted checkout callbacks', () => {
  assert.deepEqual(getCheckoutCallbackUrls(
    'https://preview.example.test/api/asaas/checkout',
    'https://www.descontododono.com.br/',
  ), {
    successUrl: 'https://www.descontododono.com.br/planos?retorno=sucesso',
    cancelUrl: 'https://www.descontododono.com.br/planos?retorno=cancelado',
    expiredUrl: 'https://www.descontododono.com.br/planos?retorno=expirado',
  })
})

test('allows request-origin fallback only for local development', () => {
  for (const configuredUrl of [undefined, '', 'not a URL']) {
    const urls = getCheckoutCallbackUrls('http://localhost:3000/api/asaas/checkout', configuredUrl)
    assert.equal(new URL(urls.successUrl).origin, 'http://localhost:3000')
    assert.match(urls.cancelUrl, /\/planos\?retorno=cancelado$/)
    assert.match(urls.expiredUrl, /\/planos\?retorno=expirado$/)
  }
})

test('requires a trusted configured origin outside local development', () => {
  for (const configuredUrl of [undefined, '', 'not a URL', 'ftp://descontododono.com.br']) {
    assert.throws(
      () => getCheckoutCallbackUrls('https://attacker.example/api/asaas/checkout', configuredUrl),
      /Configure NEXT_PUBLIC_APP_URL or VERCEL_URL/,
    )
  }
})

test('uses the trusted Vercel deployment host instead of the request host', () => {
  const urls = getCheckoutCallbackUrls(
    'https://attacker.example/api/asaas/checkout',
    undefined,
    'desconto-dono-git-main.vercel.app',
  )
  assert.equal(new URL(urls.successUrl).origin, 'https://desconto-dono-git-main.vercel.app')
})

test('ignores a localhost app URL on deployed requests and uses the Vercel host', () => {
  const urls = getCheckoutCallbackUrls(
    'https://descontododono.com.br/api/asaas/checkout',
    'http://localhost:3000',
    'desconto-dono-git-main.vercel.app',
  )
  assert.equal(new URL(urls.successUrl).origin, 'https://desconto-dono-git-main.vercel.app')
})

test('does not accept a localhost app URL for a deployed request without a Vercel host', () => {
  assert.throws(
    () => getCheckoutCallbackUrls('https://descontododono.com.br/api/asaas/checkout', 'http://localhost:3000'),
    /Configure NEXT_PUBLIC_APP_URL or VERCEL_URL/,
  )
})

test('rejects malformed Vercel host values', () => {
  assert.throws(
    () => getCheckoutCallbackUrls('https://attacker.example/api/asaas/checkout', undefined, 'trusted.example/path'),
    /Configure NEXT_PUBLIC_APP_URL or VERCEL_URL/,
  )
})
