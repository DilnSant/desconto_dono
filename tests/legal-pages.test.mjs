import assert from 'node:assert/strict'
import test from 'node:test'

const origin = process.env.LEGAL_TEST_ORIGIN ?? 'http://127.0.0.1:3000'

async function getLegalPage(path) {
  const response = await fetch(new URL(path, origin))
  assert.equal(response.status, 200, `${path} should be publicly accessible`)
  return response.text()
}

test('terms page explains acceptance, platform role, and prohibited conduct', async () => {
  const html = await getLegalPage('/termos')

  assert.match(html, /Aceitação dos Termos/)
  assert.match(html, /empreendedores de direita/)
  assert.match(html, /vitrine/)
  assert.match(html, /conteúdo ilegal/)
})

test('privacy page documents lead data, Supabase, and LGPD contact', async () => {
  const html = await getLegalPage('/privacidade')

  assert.match(html, /nome e o WhatsApp/)
  assert.match(html, /e-mail/)
  assert.match(html, /Supabase/)
  assert.match(html, /desconto\.do\.dono@gmail\.com/)
  assert.match(html, /Não vendemos/)
})
