import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Plus, Star, MessageCircle,
  MapPin, ArrowRight, Filter, BadgeCheck
} from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db as serverDb } from '@/lib/supabase/db'
import CategoryGrid from '@/components/categories/CategoryGrid'
import ListingCard from '@/components/listings/ListingCard'
import { attachPublicListingRelations } from '@/lib/directory/public-profiles'
import type { Category, PublicListing, PublicListingWithProfile, PublicProfile } from '@/types/database'
import SponsorBanner from '@/components/ui/SponsorBanner'




export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Desconto do Dono — Feed de Empresas e Descontos',
  description: 'Encontre empresas verificadas, resgate descontos exclusivos e conecte-se com empreendedores da sua cidade.',
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar dados do perfil
  const { data: profile } = await serverDb
    .from('profiles')
    .select('full_name, business_name, is_verified, city, state')
    .eq('id', user.id)
    .single()

  // Buscar anúncios
  let listings: PublicListingWithProfile[] = []
  let listingsError = false
  try {
    const { data, error } = await serverDb
      .from('listings_public')
      .select('id, user_id, category_id, subcategory_id, title, description, price, price_type, image_url, location_city, location_state, is_active, views, created_at, updated_at, grandfathered')
      .order('created_at', { ascending: false })
      .limit(8)
    if (error) throw error

    const publicListings = (data ?? []) as PublicListing[]
    const profileIds = Array.from(new Set(publicListings.map((listing) => listing.user_id)))
    const categoryIds = Array.from(new Set(publicListings.flatMap((listing) => listing.category_id ? [listing.category_id] : [])))
    const [profilesResult, categoriesResult] = await Promise.all([
      profileIds.length
        ? serverDb.from('profiles_public').select('id, full_name, business_name, bio, city, state, avatar_url, category_id, category_name, subcategory_id, subcategory_name, is_verified, plan_type, email_public, public_whatsapp, website_url, instagram_url, tiktok_url, created_at, segment_ids, subcategory_ids, service_area_ibge_codes, service_area_state_codes, service_area_names, national_coverage').in('id', profileIds)
        : { data: [], error: null },
      categoryIds.length
        ? serverDb.from('categories').select('id, name, color, slug').in('id', categoryIds)
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
    console.error('[DASHBOARD] Falha ao carregar anúncios públicos', error)
    listingsError = true
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Empreendedor'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* ===== BOAS-VINDAS ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-gray-500 flex items-center gap-1.5 mt-1 text-sm">
            <MapPin className="w-4 h-4 text-green-600" />
            {profile?.city || 'Configure sua cidade'}, {profile?.state || 'BR'}
            {profile?.is_verified && (
              <span className="ml-2 flex items-center gap-1 text-blue-600 font-semibold">
                <BadgeCheck className="w-4 h-4" /> Verificado
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/anuncio/novo" id="dashboard-new-listing"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-md hover:brightness-110 transition-all"
            style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
            <Plus className="w-4 h-4" /> Publicar Anúncio
          </Link>
          <Link href="/mensagens" id="dashboard-messages"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-gray-700 font-bold text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            <MessageCircle className="w-4 h-4" /> Mensagens
          </Link>
        </div>
      </div>

      {/* ===== BUSCA GLOBAL ===== */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          id="global-search"
          placeholder="Busque por empresa, serviço ou cidade..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-all"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
          <Filter className="w-4 h-4" /> Filtrar
        </button>
      </div>

      {/* ===== CLUBE DE BENEFÍCIOS (destaque) ===== */}
      <section className="mb-8">
        <div className="relative rounded-3xl overflow-hidden p-6 md:p-8"
          style={{ background: 'linear-gradient(135deg, #002776 0%, #004BA8 50%, #006FC0 100%)' }}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10" style={{ background: '#FEDF00' }} />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10" style={{ background: '#FEDF00' }} />
          </div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm uppercase tracking-wide">Clube de Benefícios</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Descontos exclusivos entre membros</h2>
              <p className="text-white/70 text-sm">Conheça benefícios publicados por empresas da comunidade.</p>
            </div>

            <Link href="/beneficios" id="dashboard-benefits-link"
              className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-green-950 text-sm transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}>
              Ver Todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIAS ===== */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-900">Segmentos</h2>
          <Link href="/categorias" className="text-green-700 font-semibold text-sm flex items-center gap-1 hover:underline">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <CategoryGrid />
      </section>

      {/* ===== FEED DE EMPRESAS ===== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">Diretório de Empresas</h2>
            <p className="text-gray-400 text-sm mt-0.5">Fornecedores e parceiros verificados</p>
          </div>
          <Link href="/empresas" className="text-green-700 font-semibold text-sm flex items-center gap-1 hover:underline">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {listingsError ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Não foi possível carregar os anúncios. Atualize a página para tentar novamente.
          </p>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            {listings.length >= 4 && <div className="col-span-full"><SponsorBanner variant="feed" /></div>}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center">
            <p className="font-semibold text-gray-800">Ainda não há anúncios publicados.</p>
            <Link href="/empresas" className="mt-2 inline-flex text-sm font-semibold text-green-700 hover:underline">
              Conheça as empresas cadastradas
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
