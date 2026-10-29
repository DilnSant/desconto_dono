import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, Clock, Eye, BadgeCheck, Shield, Lock, Award,
  ChevronRight, Star, ArrowLeft, Tag
} from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerDb } from '@/lib/supabase/server-db'
import { formatCurrency, formatDate, formatRelativeDate, getInitials, formatWhatsAppLink } from '@/lib/utils/helpers'
import { CATEGORY_COLOR_MAP } from '@/lib/constants/categories'
import type { Listing, Profile, Category } from '@/types/database'
import { cn } from '@/lib/utils/helpers'
import AnuncioClientActions from './AnuncioClientActions'

interface Props {
  params: Promise<{ id: string }>
}

type FullListing = Listing & {
  profiles: Profile & { categories: Category | null }
  categories: Category | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await getServerDb()
  const { data } = await supabase.from('listings').select('title, description').eq('id', id).single()
  if (!data) return { title: 'Anúncio não encontrado' }
  return {
    title: `${data.title} | Desconto do Dono`,
    description: data.description || `Confira esta oferta no Desconto do Dono e resgate seu desconto.`,
  }
}

export const dynamic = 'force-dynamic'

export default async function AnuncioPage({ params }: Props) {
  const { id } = await params
  const supabase = await getServerDb()

  const { data } = await supabase
    .from('listings')
    .select(`*, profiles:user_id(*, categories(*)), categories:category_id(*)`)
    .eq('id', id)
    .single()

  if (!data) notFound()

  // Incrementar views
  await supabase.from('listings').update({ views: (data.views || 0) + 1 }).eq('id', id)

  const listing = data as unknown as FullListing
  const colors = CATEGORY_COLOR_MAP[listing.categories?.color || 'neutral']
  const whatsappLink = listing.profiles?.whatsapp
    ? formatWhatsAppLink(listing.profiles.whatsapp, `Olá! Vi sua oferta "${listing.title}" no Desconto do Dono.`)
    : null

  const businessName = listing.profiles?.business_name || listing.profiles?.full_name || 'Empresa'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-green-700">Início</Link>
        <ChevronRight className="w-4 h-4" />
        {listing.categories && (
          <>
            <Link href={`/categoria/${listing.categories.slug}`} className="hover:text-green-700">
              {listing.categories.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="font-semibold text-gray-800 truncate max-w-[200px]">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== COLUNA PRINCIPAL ===== */}
        <div className="lg:col-span-2 space-y-4">

          {/* Imagem */}
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-gray-100 shadow-sm">
            {listing.image_url ? (
              <Image src={listing.image_url} alt={listing.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f0f9f0, #e0f2e9)' }}>
                <span className="text-6xl opacity-30">🏷️</span>
              </div>
            )}
            {listing.categories && (
              <span className={cn('absolute top-4 left-4 text-sm font-bold px-3 py-1.5 rounded-full shadow', colors.badge)}>
                {listing.categories.name}
              </span>
            )}
          </div>

          {/* Video embed (Profissional/Premium) */}
          {listing.video_embed_url && (
            <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              <iframe
                src={listing.video_embed_url}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`Vídeo de ${listing.title}`}
              />
            </div>
          )}

          {/* Título e meta */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h1 className="text-2xl font-black text-gray-900 mb-3">{listing.title}</h1>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-green-600" />
                {listing.location_city}, {listing.location_state}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatRelativeDate(listing.created_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {(listing.views || 0).toLocaleString('pt-BR')} visualizações
              </span>
            </div>

            {/* Preço / Desconto */}
            <div className="py-4 border-t border-b border-gray-50 mb-4">
              {listing.price_type === 'free' ? (
                <p className="text-2xl font-black text-green-600">Grátis</p>
              ) : listing.price_type === 'negotiable' ? (
                <p className="text-2xl font-black text-orange-600">A negociar</p>
              ) : listing.price !== null ? (
                <p className="text-3xl font-black text-gray-900">{formatCurrency(listing.price)}</p>
              ) : null}
            </div>

            {/* Descrição */}
            {listing.description && (
              <div>
                <h2 className="font-black text-gray-800 mb-2">Descrição da Oferta</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* CTA principal — Resgatar Desconto */}
            <div className="mt-6 pt-4 border-t border-gray-50">
              <AnuncioClientActions
                listingId={listing.id}
                listingTitle={listing.title}
                businessName={businessName}
                whatsappLink={whatsappLink}
                profileUserId={listing.user_id}
              />
            </div>
          </div>
        </div>

        {/* ===== SIDEBAR ===== */}
        <div className="space-y-4">

          {/* Card do anunciante */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
            {/* Capa mini */}
            <div className="h-16 relative">
              {listing.profiles?.cover_url ? (
                <Image src={listing.profiles.cover_url} alt="Capa" fill className="object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #009B3A, #002776)' }} />
              )}
            </div>

            <div className="px-5 pb-5 -mt-8">
              {/* Avatar */}
              <div className="relative mb-3">
                {listing.profiles?.avatar_url ? (
                  <Image src={listing.profiles.avatar_url} alt={listing.profiles.full_name}
                    width={64} height={64}
                    className="rounded-2xl border-4 border-white shadow-md object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white text-lg font-black"
                    style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                    {getInitials(listing.profiles?.business_name || listing.profiles?.full_name || 'DD')}
                  </div>
                )}
                {listing.profiles?.is_verified && (
                  <BadgeCheck className="absolute -bottom-1.5 -right-1.5 w-5 h-5 text-blue-500 bg-white rounded-full shadow" />
                )}
              </div>

              <h3 className="font-black text-gray-900">
                {listing.profiles?.business_name || listing.profiles?.full_name}
              </h3>
              {listing.profiles?.business_name && (
                <p className="text-gray-500 text-sm">{listing.profiles.full_name}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <MapPin className="w-3 h-3" />
                <span>{listing.profiles?.city}, {listing.profiles?.state}</span>
              </div>

              {/* Selos */}
              <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                {listing.profiles?.is_verified && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border text-blue-600 bg-blue-50 border-blue-200">
                    <BadgeCheck className="w-3 h-3" /> Verificado
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border text-green-600 bg-green-50 border-green-200">
                  <Lock className="w-3 h-3" /> Seguro
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border text-purple-600 bg-purple-50 border-purple-200">
                  <Award className="w-3 h-3" /> Garantia
                </span>
              </div>

              {/* Ver perfil */}
              <Link href={`/perfil/${listing.user_id}`}
                id="btn-view-profile"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-gray-700 font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                Ver perfil completo
              </Link>

              {/* Aviso de segurança */}
              <div className="mt-4 flex items-start gap-1.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Negocie sempre pela plataforma. Não faça pagamentos antecipados sem verificar o anunciante.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
