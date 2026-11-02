import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getServerDb } from '@/lib/supabase/server-db'
import { CATEGORIES_STATIC, CATEGORY_COLOR_MAP } from '@/lib/constants/categories'
import ListingCard from '@/components/listings/ListingCard'
import { attachPublicListingRelations } from '@/lib/directory/public-profiles'
import type { Category, PublicListing, PublicListingWithProfile, PublicProfile } from '@/types/database'
import { cn } from '@/lib/utils/helpers'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sub?: string; q?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = CATEGORIES_STATIC.find((c) => c.slug === slug)
  if (!cat) return { title: 'Categoria não encontrada' }
  return {
    title: `${cat.name} — Classificados | Desconto do Dono`,
    description: `Encontre os melhores serviços e produtos na categoria ${cat.name}. Empreendedores verificados em todo o Brasil.`,
  }
}


export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { sub, q } = await searchParams

  const category = CATEGORIES_STATIC.find((c) => c.slug === slug)
  if (!category) notFound()

  const colors = CATEGORY_COLOR_MAP[category.color]
  const selectedSub = category.subcategories.find((s) => s.slug === sub)

  // Buscar anúncios da categoria
  let listings: PublicListingWithProfile[] = []
  let queryError = false
  try {
    const supabase = await getServerDb()
    let query = supabase
      .from('listings_public')
      .select('id, user_id, category_id, subcategory_id, title, description, price, price_type, image_url, location_city, location_state, is_active, views, created_at, updated_at, grandfathered')
      .eq('category_id', category.id)
      .order('created_at', { ascending: false })
      .limit(24)

    if (selectedSub) query = query.eq('subcategory_id', selectedSub.id)
    if (q) query = query.ilike('title', `%${q}%`)

    const { data, error } = await query
    if (error) throw error

    const publicListings = (data ?? []) as PublicListing[]
    const profileIds = Array.from(new Set(publicListings.map((listing) => listing.user_id)))
    const categoryIds = Array.from(new Set(publicListings.flatMap((listing) => listing.category_id ? [listing.category_id] : [])))
    const [profilesResult, categoriesResult] = await Promise.all([
      profileIds.length
        ? supabase.from('profiles_public').select('id, full_name, business_name, bio, city, state, avatar_url, category_id, category_name, subcategory_id, subcategory_name, is_verified, plan_type, email_public, public_whatsapp, website_url, instagram_url, tiktok_url, created_at, segment_ids, subcategory_ids, service_area_ibge_codes, service_area_state_codes, service_area_names, national_coverage').in('id', profileIds)
        : { data: [], error: null },
      categoryIds.length
        ? supabase.from('categories').select('id, name, color, slug').in('id', categoryIds)
        : { data: [], error: null },
    ])
    if (profilesResult.error) throw profilesResult.error
    if (categoriesResult.error) throw categoriesResult.error
    listings = attachPublicListingRelations(
      publicListings,
      (profilesResult.data ?? []) as PublicProfile[],
      (categoriesResult.data ?? []) as Pick<Category, 'id' | 'name' | 'color' | 'slug'>[],
    )
  } catch (error) {
    console.error('[CATEGORIA] Falha ao carregar anúncios públicos', error)
    queryError = true
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-green-700 transition-colors">Início</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/categorias" className="hover:text-green-700 transition-colors">Categorias</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-semibold text-gray-800">{category.name}</span>
        {selectedSub && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className={cn('font-semibold', colors.text)}>{selectedSub.name}</span>
          </>
        )}
      </div>

      {/* Header da categoria */}
      <div className={cn('rounded-3xl p-6 mb-6 border', colors.light, colors.border)}>
        <div className="flex items-center gap-4">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl', colors.bg)}>
            {/* Ícone representativo */}
            <span>📂</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">{category.name}</h1>
            {selectedSub && (
              <p className={cn('font-semibold text-lg', colors.text)}>› {selectedSub.name}</p>
            )}
            <p className="text-gray-500 text-sm mt-0.5">
              {queryError ? 'Não foi possível carregar os anúncios.' : listings.length === 0 ? 'Nenhum anúncio encontrado' : `${listings.length} anúncio${listings.length !== 1 ? 's' : ''} encontrado${listings.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros por subcategoria */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/categoria/${slug}`}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-semibold transition-all',
            !sub ? `${colors.badge} shadow-sm` : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          )}>
          Todos
        </Link>
        {category.subcategories.map((s) => (
          <Link
            key={s.id}
            href={`/categoria/${slug}?sub=${s.slug}`}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-semibold transition-all',
              sub === s.slug ? `${colors.badge} shadow-sm` : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            )}>
            {s.name}
          </Link>
        ))}
      </div>

      {/* Grade de anúncios */}
      {queryError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          Não foi possível carregar os anúncios desta categoria. Atualize a página para tentar novamente.
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-3xl', colors.light)}>📭</div>
          <div>
            <p className="font-bold text-gray-700 text-lg">Nenhum anúncio nesta categoria ainda</p>
            <p className="text-gray-400 text-sm mt-1">Seja o primeiro a anunciar em {category.name}!</p>
          </div>
          <Link href="/anuncio/novo"
            className="px-6 py-3 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all"
            style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
            Publicar Anúncio
          </Link>
        </div>
      )}
    </div>
  )
}
