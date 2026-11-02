import Link from 'next/link'
import { AlertCircle, ArrowRight, Building2 } from 'lucide-react'
import { CATEGORIES_STATIC } from '@/lib/constants/categories'
import CompanyDirectoryFilters from '@/components/directory/CompanyDirectoryFilters'
import ProfileCard from '@/components/profile/ProfileCard'
import { getServerDb } from '@/lib/supabase/server-db'
import {
  buildPublicDirectoryFilters,
  getPublicCoverageLabel,
} from '@/lib/directory/public-profiles'
import type { PublicDirectoryFilters } from '@/lib/directory/public-profiles'
import type { PublicProfile, PublicProfileCardData } from '@/types/database'

interface Props {
  searchParams: Promise<{
    ibgeCode?: string | string[]
    stateCode?: string | string[]
    municipalityName?: string | string[]
    categoryId?: string | string[]
  }>
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export const dynamic = 'force-dynamic'

export default async function CompaniesPage({ searchParams }: Props) {
  const params = await searchParams
  const filters: PublicDirectoryFilters = {
    ibgeCode: firstValue(params.ibgeCode),
    stateCode: firstValue(params.stateCode),
    categoryId: firstValue(params.categoryId),
  }
  const municipalityName = firstValue(params.municipalityName)
  let filterError: string | null = null
  let queryError: string | null = null
  let profiles: PublicProfile[] = []

  try {
    const publicFilters = buildPublicDirectoryFilters(filters)
    const supabase = await getServerDb()
    let query = supabase
      .from('profiles_public')
      .select('id, full_name, business_name, bio, city, state, avatar_url, category_id, category_name, subcategory_id, subcategory_name, is_verified, plan_type, email_public, public_whatsapp, website_url, instagram_url, tiktok_url, created_at, segment_ids, subcategory_ids, service_area_ibge_codes, service_area_state_codes, service_area_names, national_coverage')
      .order('business_name', { ascending: true })
      .limit(60)

    if (publicFilters.locationOr) query = query.or(publicFilters.locationOr)
    if (publicFilters.categoryId) query = query.contains('segment_ids', [publicFilters.categoryId])

    const { data, error } = await query
    if (error) throw error
    profiles = (data ?? []) as PublicProfile[]
  } catch (error) {
    if (error instanceof Error && error.message.includes('inválid')) {
      filterError = error.message
    } else {
      console.error('[DIRETÓRIO] Falha ao carregar empresas', error)
      queryError = 'Não foi possível carregar as empresas agora.'
    }
  }

  const cardProfiles: Array<{
    profile: PublicProfileCardData
    coverageLabel: string
  }> = profiles.map((profile) => ({
    profile,
    coverageLabel: getPublicCoverageLabel(profile),
  }))

  return (
    <main className="min-h-screen bg-[#f5f8f5]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <header className="mb-8 max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e6f3e8] px-3 py-1.5 text-sm font-semibold text-[#005c2d]">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            Empresas e profissionais
          </p>
          <h1 className="text-4xl font-black tracking-tight text-[#183323] md:text-5xl">
            Encontre quem atende na sua região.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
            Busque por município, estado ou segmento e converse diretamente pelo Desconto do Dono.
          </p>
        </header>

        <CompanyDirectoryFilters
          categories={CATEGORIES_STATIC.map(({ id, name }) => ({ id, name }))}
          initialIbgeCode={filters.ibgeCode}
          initialStateCode={filters.stateCode}
          initialMunicipalityName={municipalityName}
          initialCategoryId={filters.categoryId}
        />

        {filterError && (
          <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {filterError} Confira os filtros e tente novamente.
          </div>
        )}

        {queryError ? (
          <section role="alert" className="mt-10 rounded-2xl border border-red-200 bg-white px-6 py-10 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-600" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-bold text-gray-900">{queryError}</h2>
            <p className="mt-2 text-sm text-gray-600">Tente atualizar a busca em alguns instantes.</p>
            <form action="/empresas" method="get" className="mt-5">
              {filters.ibgeCode && <input type="hidden" name="ibgeCode" value={filters.ibgeCode} />}
              {filters.stateCode && <input type="hidden" name="stateCode" value={filters.stateCode} />}
              {filters.categoryId && <input type="hidden" name="categoryId" value={filters.categoryId} />}
              <button type="submit" className="rounded-xl bg-[#005c2d] px-5 py-3 text-sm font-bold text-white hover:bg-[#004822]">
                Tentar novamente
              </button>
            </form>
          </section>
        ) : cardProfiles.length > 0 ? (
          <section aria-label="Empresas encontradas" className="mt-8">
            <p className="mb-4 text-sm text-gray-600">
              {cardProfiles.length} {cardProfiles.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
            </p>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {cardProfiles.map(({ profile, coverageLabel }) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  coverageLabel={coverageLabel}
                />
              ))}
            </div>
          </section>
        ) : !filterError ? (
          <section className="mt-10 rounded-2xl border border-[#dce8df] bg-white px-6 py-12 text-center">
            <Building2 className="mx-auto h-9 w-9 text-[#007a39]" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Ainda não há empresas com esses filtros.</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600">
              Crie seu perfil gratuito e ajude outras pessoas a encontrar seu negócio.
            </p>
            <Link href="/cadastro" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#005c2d] px-5 py-3 text-sm font-bold text-white hover:bg-[#004822]">
              Criar perfil gratuito <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  )
}
