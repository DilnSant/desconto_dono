import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import test from 'node:test'

const directoryModuleUrl = new URL('../src/lib/directory/public-profiles.ts', import.meta.url)
const repositoryRoot = new URL('../', import.meta.url)

async function loadDirectory() {
  assert.ok(existsSync(directoryModuleUrl), 'Public directory helpers must exist')
  return import(directoryModuleUrl.href)
}

async function readSource(path) {
  return readFile(new URL(path, repositoryRoot), 'utf8')
}

const localProvider = {
  id: 'local',
  segment_ids: ['aa000000-0000-4000-8000-000000000001'],
  service_area_ibge_codes: ['3550308'],
  service_area_state_codes: ['SP'],
  service_area_names: ['São Paulo, SP'],
  national_coverage: false,
}

const nationalProvider = {
  id: 'national',
  segment_ids: ['aa000000-0000-4000-8000-000000000001'],
  service_area_ibge_codes: [],
  service_area_state_codes: [],
  service_area_names: [],
  national_coverage: true,
}

const legacyStateProvider = {
  id: 'legacy-state',
  segment_ids: [],
  service_area_ibge_codes: [],
  service_area_state_codes: [],
  service_area_names: [],
  national_coverage: false,
  city: 'Florianópolis',
  state: 'SC',
}

test('builds safe PostgREST filters for municipality, state, and segment', async () => {
  const { buildPublicDirectoryFilters } = await loadDirectory()

  assert.deepEqual(buildPublicDirectoryFilters({
    ibgeCode: '3550308',
    stateCode: 'SP',
    categoryId: 'aa000000-0000-4000-8000-000000000001',
  }), {
    locationOr: 'and(service_area_ibge_codes.cs.{3550308},service_area_state_codes.cs.{SP}),national_coverage.eq.true',
    categoryId: 'aa000000-0000-4000-8000-000000000001',
  })

  assert.throws(
    () => buildPublicDirectoryFilters({ ibgeCode: '3550308),id.neq.null' }),
    /município IBGE/i,
  )
  assert.throws(
    () => buildPublicDirectoryFilters({ stateCode: 'SP),id.neq.null' }),
    /UF/i,
  )
})

test('matches local providers by coverage, includes national providers, and filters segments', async () => {
  const { matchesPublicDirectoryFilters } = await loadDirectory()

  assert.equal(matchesPublicDirectoryFilters(localProvider, {
    ibgeCode: '3550308',
    stateCode: 'SP',
    categoryId: 'aa000000-0000-4000-8000-000000000001',
  }), true)
  assert.equal(matchesPublicDirectoryFilters(localProvider, {
    ibgeCode: '3304557',
    stateCode: 'RJ',
  }), false)
  assert.equal(matchesPublicDirectoryFilters(nationalProvider, {
    ibgeCode: '3304557',
    stateCode: 'RJ',
    categoryId: 'aa000000-0000-4000-8000-000000000001',
  }), true)
  assert.equal(matchesPublicDirectoryFilters(nationalProvider, {
    categoryId: 'aa000000-0000-4000-8000-000000000002',
  }), false)
})

test('includes legacy profiles by their base UF only when a municipality is not selected', async () => {
  const { buildPublicDirectoryFilters, matchesPublicDirectoryFilters } = await loadDirectory()

  assert.deepEqual(buildPublicDirectoryFilters({ stateCode: 'SC' }), {
    locationOr: 'service_area_state_codes.cs.{SC},and(state.eq.SC,service_area_state_codes.eq.{}),national_coverage.eq.true',
    categoryId: null,
  })
  assert.equal(matchesPublicDirectoryFilters(legacyStateProvider, { stateCode: 'SC' }), true)
  assert.equal(matchesPublicDirectoryFilters(legacyStateProvider, { stateCode: 'RS' }), false)
  assert.equal(matchesPublicDirectoryFilters(legacyStateProvider, { ibgeCode: '4205407', stateCode: 'SC' }), false)
  assert.equal(matchesPublicDirectoryFilters({
    ...legacyStateProvider,
    service_area_state_codes: ['RS'],
  }, { stateCode: 'SC' }), false)
  assert.equal(matchesPublicDirectoryFilters({
    ...legacyStateProvider,
    service_area_state_codes: ['RS'],
    state: 'SC',
  }, { stateCode: 'SC' }), false)
})

test('labels national providers explicitly in directory results', async () => {
  const { getPublicCoverageLabel } = await loadDirectory()

  assert.equal(getPublicCoverageLabel(nationalProvider), 'Atuação nacional')
  assert.equal(getPublicCoverageLabel(localProvider), 'São Paulo, SP')
})

test('attaches listing cards only to approved public profile and category data', async () => {
  const { attachPublicListingRelations } = await loadDirectory()
  const listing = {
    id: 'listing-1',
    user_id: 'local',
    category_id: 'aa000000-0000-4000-8000-000000000001',
    subcategory_id: null,
    title: 'Serviço',
    description: null,
    price: null,
    price_type: 'negotiable',
    image_url: null,
    location_city: 'São Paulo',
    location_state: 'SP',
    is_active: true,
    views: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    grandfathered: false,
  }
  const profile = { ...localProvider, full_name: 'Empresa', business_name: null }
  const category = {
    id: listing.category_id,
    name: 'Serviços',
    color: 'green',
    slug: 'servicos',
  }

  assert.deepEqual(
    attachPublicListingRelations([listing], [profile], [category]).map((row) => row.id),
    ['listing-1'],
  )
  assert.deepEqual(attachPublicListingRelations([listing], [], [category]), [])
})

test('public profile view omits private contact and media fields while gating public contacts by plan', async () => {
  const schema = await readSource('supabase/schema_v4.sql')
  const view = schema
    .split('CREATE OR REPLACE VIEW public.profiles_public')[1]
    ?.split('CREATE OR REPLACE VIEW public.listings_public')[0]

  assert.ok(view, 'profiles_public view must be defined')
  assert.doesNotMatch(view, /\bp\.email\b/)
  assert.doesNotMatch(view, /\bp\.whatsapp\b/)
  assert.doesNotMatch(view, /\bcover_url\b/)
  assert.match(view, /p\.email_public[\s\S]*?ELSE NULL[\s\S]*?END AS email_public/)
  assert.match(view, /p\.public_whatsapp[\s\S]*?ELSE NULL[\s\S]*?END AS public_whatsapp/)
  assert.match(view, /p\.website_url[\s\S]*?ELSE NULL[\s\S]*?END AS website_url/)
  assert.match(view, /p\.instagram_url[\s\S]*?ELSE NULL[\s\S]*?END AS instagram_url/)
  assert.match(view, /p\.tiktok_url[\s\S]*?ELSE NULL[\s\S]*?END AS tiktok_url/)
  assert.match(view, /p\.is_verified/)
  assert.match(view, /service_area_state_codes/)
  assert.match(view, /WHEN COALESCE\(effective\.plan_type, 'Gratuito'\) IN \('Essencial', 'Profissional'\)/)

  const listingsView = schema
    .split('CREATE OR REPLACE VIEW public.listings_public')[1]
    ?.split('REVOKE ALL ON public.profiles_public')[0]
  assert.ok(listingsView, 'listings_public view must be defined')
  assert.match(listingsView, /profile\.accepted_terms IS TRUE/)
  assert.match(listingsView, /profile\.is_active IS TRUE/)
})

test('public pages and message/lead lookups use allowlisted profile and listing views', async () => {
  const publicFiles = [
    'src/app/perfil/[id]/page.tsx',
    'src/app/categoria/[slug]/page.tsx',
    'src/app/anuncio/[id]/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/mensagens/page.tsx',
    'src/app/api/leads/route.ts',
    'src/app/beneficios/page.tsx',
  ]
  const sources = await Promise.all(publicFiles.map(readSource))

  assert.match(sources[0], /\.from\('profiles_public'\)/)
  assert.match(sources[0], /\.from\('listings_public'\)/)
  assert.match(sources[1], /\.from\('listings_public'\)/)
  assert.match(sources[2], /\.from\('listings_public'\)/)
  assert.match(sources[3], /\.from\('listings_public'\)/)
  assert.match(sources[4], /\.from\('profiles_public'\)/)
  assert.match(sources[5], /\.from\('profiles_public'\)/)
  assert.match(sources[6], /\.from\('profiles_public'\)/)

  assert.doesNotMatch(sources[0], /\.from\('profiles'\)/)
  assert.doesNotMatch(sources[0], /\.from\('listings'\)/)
  assert.doesNotMatch(sources[1], /\.from\('listings'\)/)
  assert.doesNotMatch(sources[2], /\.from\('listings'\)/)
  assert.doesNotMatch(sources[4], /\.from\('profiles'\)/)
  assert.doesNotMatch(sources[5], /\.from\('profiles'\)/)
  assert.doesNotMatch(sources[6], /\.from\('profiles'\)/)
})

test('company directory loads live segment IDs and presents filters in a responsive sidebar', async () => {
  const page = await readSource('src/app/empresas/page.tsx')
  const filters = await readSource('src/components/directory/CompanyDirectoryFilters.tsx')

  assert.match(page, /from\('categories'\)[\s\S]*?select\('id, name'\)/)
  assert.doesNotMatch(page, /CATEGORIES_STATIC/)
  assert.match(page, /lg:grid-cols-\[17rem_minmax\(0,1fr\)\]/)
  assert.match(filters, /aria-label="Filtros para empresas"/)
  assert.match(filters, /name="stateCode"/)
  assert.match(filters, /name="categoryId"/)
  assert.match(filters, /name="ibgeCode"/)
})

test('listing views are incremented atomically through a server-role-only function', async () => {
  const schema = await readSource('supabase/schema_v4.sql')
  const listingPage = await readSource('src/app/anuncio/[id]/page.tsx')

  assert.match(schema, /FUNCTION public\.increment_public_listing_view\(p_listing_id uuid\)/)
  assert.match(schema, /REVOKE ALL ON FUNCTION public\.increment_public_listing_view\(uuid\) FROM PUBLIC, anon, authenticated/)
  assert.match(schema, /GRANT EXECUTE ON FUNCTION public\.increment_public_listing_view\(uuid\) TO service_role/)
  assert.match(schema, /SET views = COALESCE\(views, 0\) \+ 1/)
  assert.match(listingPage, /admin\.rpc\('increment_public_listing_view'/)
})

test('profile cards never render private WhatsApp or direct cover URLs', async () => {
  const source = await readSource('src/components/profile/ProfileCard.tsx')

  assert.match(source, /public_whatsapp/)
  assert.doesNotMatch(source, /profile\.whatsapp/)
  assert.doesNotMatch(source, /profile\.cover_url/)
})

test('company directory uses public filters and renders explicit errors and retry', async () => {
  const source = await readSource('src/app/empresas/page.tsx')
  const header = await readSource('src/components/layout/Header.tsx')

  assert.match(source, /\.from\('profiles_public'\)/)
  assert.match(source, /ibgeCode/)
  assert.match(source, /stateCode/)
  assert.match(source, /categoryId/)
  assert.match(source, /getPublicCoverageLabel/)
  assert.match(source, /Tentar novamente/)
  assert.match(source, /Erro|Não foi possível/)
  assert.match(header, /href="\/empresas"/)
})
