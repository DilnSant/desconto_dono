import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const planPageUrl = new URL('../src/app/planos/page.tsx', import.meta.url)
const legalContentUrl = new URL('../src/lib/legal/legal-content.ts', import.meta.url)

test('public plan page uses the shared monthly prices and current entitlements', async () => {
  assert.ok(existsSync(planPageUrl), 'the public /planos page must exist')

  const page = readFileSync(planPageUrl, 'utf8')
  const { getPlanEntitlements, getPlanMonthlyPriceCents } = await import('../src/lib/plans/entitlements.ts')

  assert.equal(typeof getPlanMonthlyPriceCents, 'function')
  assert.deepEqual(
    ['Gratuito', 'Essencial', 'Profissional'].map((plan) => getPlanMonthlyPriceCents(plan)),
    [0, 3990, 5990],
  )
  assert.deepEqual(getPlanEntitlements('Gratuito'), {
    maxNewActiveListings: 1,
    maxMunicipalities: 1,
    allowsNationalCoverage: false,
    maxSegments: 1,
    maxSubcategories: 3,
    maxProfilePhotos: 0,
    publicContacts: false,
  })
  assert.deepEqual(getPlanEntitlements('Essencial'), {
    maxNewActiveListings: 3,
    maxMunicipalities: 3,
    allowsNationalCoverage: true,
    maxSegments: 2,
    maxSubcategories: 6,
    maxProfilePhotos: 3,
    publicContacts: true,
  })
  assert.deepEqual(getPlanEntitlements('Profissional'), {
    maxNewActiveListings: 5,
    maxMunicipalities: 5,
    allowsNationalCoverage: true,
    maxSegments: 3,
    maxSubcategories: 10,
    maxProfilePhotos: 10,
    publicContacts: true,
  })
  assert.match(page, /getPlanEntitlements/)
  assert.match(page, /getPlanMonthlyPriceCents/)
  assert.match(page, /href=["']\/cadastro["']/)
})

test('public plan page explains ad prices and independent verification without unsupported promises', () => {
  assert.ok(existsSync(planPageUrl), 'the public /planos page must exist')
  const page = readFileSync(planPageUrl, 'utf8')

  assert.match(page, /“Grátis”, “Fixo” e “Negociável”/)
  assert.match(page, /preço do produto ou serviço anunciado.*não.*cobrança da plataforma/i)
  assert.match(page, /empresa verificada.*não.*plano/i)
  assert.doesNotMatch(page, /Premium|anual|vídeo|destaque|analytics|suporte 24h|alterações ilimitadas/i)
  assert.match(page, /CheckoutButton/)
})

test('legal contact uses the corporate address', () => {
  const legalContent = readFileSync(legalContentUrl, 'utf8')

  assert.match(legalContent, /faleconosco@descontododono\.com\.br/)
  assert.doesNotMatch(legalContent, /desconto\.do\.dono@gmail\.com/)
})

test('public marketing screens do not show waitlist, video, or fabricated business metrics', () => {
  const header = readFileSync(new URL('../src/components/layout/Header.tsx', import.meta.url), 'utf8')
  const publicScreenPaths = [
    '../src/components/landing/LandingPage.tsx',
    '../src/components/layout/Header.tsx',
    '../src/components/layout/Footer.tsx',
    '../src/app/dashboard/page.tsx',
    '../src/app/beneficios/page.tsx',
    '../src/app/beneficios/BeneficiosFeed.tsx',
    '../src/app/anuncio/novo/page.tsx',
    '../src/app/anuncio/[id]/page.tsx',
    '../src/app/perfil/[id]/page.tsx',
  ]
  const content = publicScreenPaths
    .map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'))
    .join('\n')

  assert.equal(
    /lista de espera|waitlist|esperar sua cidade abrir|minha cidade abrir|aspect-video|video_embed_url|Assistir vídeo|tempo assistido/i.test(content),
    false,
    'public screens must not contain retired waitlist and video UI',
  )
  assert.equal(/12\.500\+|48k\+|2\.800\+/i.test(content), false, 'public screens must not show unverified metrics')
  assert.equal(
    /Empresa Exemplo|Empresa Fictícia|mockListings|mockBenefits/i.test(content),
    false,
    'public screens must not show fictitious businesses',
  )
  assert.doesNotMatch(header, />\s*3\s*</, 'message count must not be a fabricated fixed value')
})
