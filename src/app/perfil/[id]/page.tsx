import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  BadgeCheck, Star, Globe, AtSign, Phone, Mail,
  MapPin, MessageCircle, Lock, Award, ArrowLeft, Calendar,
} from 'lucide-react'
import { getServerDb } from '@/lib/supabase/server-db'
import { formatDate, formatWhatsAppLink, getInitials } from '@/lib/utils/helpers'
import { CATEGORY_COLOR_MAP } from '@/lib/constants/categories'
import ListingCard from '@/components/listings/ListingCard'
import type { Category, PublicListing, PublicListingWithProfile, PublicProfile, PlanType } from '@/types/database'
import { cn } from '@/lib/utils/helpers'
import { normalizeStoredPlanType } from '@/lib/plans/entitlements'
import { getSignedPublicGallery } from '@/lib/profiles/gallery'
import { getPublicServiceHours } from '@/lib/profiles/service-hours'
import { CATEGORIES_STATIC } from '@/lib/constants/categories'
import type { Json } from '@/types/database'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await getServerDb()
  const { data, error } = await supabase
    .from('profiles_public')
    .select('full_name, business_name, bio, city, state')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error

  if (!data) return { title: 'Perfil não encontrado' }

  const name = data.business_name || data.full_name
  return {
    title: `${name} — ${data.city}, ${data.state} | Desconto do Dono`,
    description: data.bio || `Veja o perfil de ${name} no Desconto do Dono e confira suas ofertas.`,
  }
}

export const dynamic = 'force-dynamic'

// ============================================================
// Helper: Verifica permissões do plano
// ============================================================
function canShowContacts(plan: PlanType) {
  return plan === 'Essencial' || plan === 'Profissional'
}

function getVisibleServiceSegments(value: Json) {
  if (!Array.isArray(value)) return []
  return value.flatMap((segment) => {
    if (typeof segment !== 'object' || segment === null || Array.isArray(segment)) return []
    const categoryName = segment.category_name
    const audiences = segment.service_audiences
    if (typeof categoryName !== 'string' || !Array.isArray(audiences)) return []
    const serviceAudiences = audiences.filter(
      (audience): audience is 'commercial' | 'residential' =>
        audience === 'commercial' || audience === 'residential',
    )
    return serviceAudiences.length > 0 ? [{ categoryName, serviceAudiences }] : []
  })
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await getServerDb()

  const [profileResult, listingsResult] = await Promise.all([
    supabase
      .from('profiles_public')
      .select('id, full_name, business_name, bio, city, state, avatar_url, category_id, category_name, subcategory_id, subcategory_name, is_verified, plan_type, email_public, public_whatsapp, website_url, instagram_url, tiktok_url, created_at, segment_ids, subcategory_ids, service_area_ibge_codes, service_area_state_codes, service_area_names, national_coverage, service_hours, service_segments')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('listings_public')
      .select('id, user_id, category_id, subcategory_id, title, description, price, price_type, image_url, location_city, location_state, is_active, views, created_at, updated_at, grandfathered')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(6),
  ])
  if (profileResult.error) throw profileResult.error
  if (listingsResult.error) throw listingsResult.error

  if (!profileResult.data) notFound()

  const typedProfile = profileResult.data as PublicProfile
  const visibleServiceSegments = getVisibleServiceSegments(typedProfile.service_segments)
  const visibleServiceHours = getPublicServiceHours(typedProfile.service_hours)
  const publicListings = (listingsResult.data ?? []) as PublicListing[]
  const categoryIds = Array.from(new Set(publicListings.flatMap((listing) => listing.category_id ? [listing.category_id] : [])))
  const categoriesResult = categoryIds.length
    ? await supabase.from('categories').select('id, name, color, slug').in('id', categoryIds)
    : { data: [], error: null }
  if (categoriesResult.error) throw categoriesResult.error
  const categoryMap = new Map<string, Pick<Category, 'id' | 'name' | 'color' | 'slug'>>()
  for (const category of categoriesResult.data ?? []) categoryMap.set(category.id, category)
  const listings: PublicListingWithProfile[] = publicListings.map((listing) => ({
    ...listing,
    profiles: typedProfile,
    categories: listing.category_id ? categoryMap.get(listing.category_id) ?? null : null,
  }))
  const primaryCategory = CATEGORIES_STATIC.find((category) => category.id === typedProfile.category_id)
  const colors = CATEGORY_COLOR_MAP[primaryCategory?.color || 'neutral']
  const plan = normalizeStoredPlanType(typedProfile.plan_type || 'Gratuito')
  const signedGallery = await getSignedPublicGallery(id)
  const coverImage = signedGallery.find((image) => image.id === 'cover')?.url
  const galleryImages = signedGallery.filter((image) => image.id !== 'cover')

  const whatsappLink = typedProfile.public_whatsapp
    ? formatWhatsAppLink(typedProfile.public_whatsapp, `Olá ${typedProfile.business_name || typedProfile.full_name}, vi seu perfil no Desconto do Dono!`)
    : null

  const showContacts = canShowContacts(plan)
  const isProfessional = plan === 'Profissional'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Voltar */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-700 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* ===== HERO DO PERFIL ===== */}
      <div className={cn(
        'bg-white rounded-3xl border shadow-sm overflow-hidden mb-6',
        isProfessional ? 'border-yellow-300 ring-2 ring-yellow-400' : 'border-gray-100'
      )}>
        {/* Capa */}
        <div className="relative h-48 md:h-64">
          {coverImage ? (
            <Image src={coverImage} alt="Capa" width={1600} height={600} unoptimized
              className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #005C2D 0%, #009B3A 50%, #002776 100%)' }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Badge de plano no topo da capa */}
          {plan !== 'Gratuito' && (
            <div className="absolute top-4 right-4">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-lg',
                plan === 'Profissional' ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700' :
                'text-gray-800 bg-yellow-100'
              )}>
                <Star className="w-3 h-3" />
                {plan}
              </span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              {typedProfile.avatar_url ? (
                <Image src={typedProfile.avatar_url} alt={typedProfile.full_name}
                  width={96} height={96}
                  className="rounded-2xl border-4 border-white shadow-lg object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-black"
                  style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                  {getInitials(typedProfile.business_name || typedProfile.full_name)}
                </div>
              )}
              {typedProfile.is_verified && (
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5 shadow-md">
                  <BadgeCheck className="w-6 h-6 text-blue-500" />
                </div>
              )}
            </div>

            {/* Info + CTA */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  {typedProfile.business_name || typedProfile.full_name}
                </h1>
                {typedProfile.business_name && (
                  <p className="text-gray-500">{typedProfile.full_name}</p>
                )}
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{typedProfile.city}, {typedProfile.state}</span>
                  <span className="text-gray-200 mx-1">·</span>
                  <Calendar className="w-4 h-4" />
                  <span>Membro desde {formatDate(typedProfile.created_at)}</span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 shrink-0">
                {/* WhatsApp: só exibe se plano >= Essencial */}
                {showContacts && whatsappLink && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                    id={`whatsapp-profile-${id}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-105 hover:shadow-md"
                    style={{ background: '#25D366' }}>
                    <Phone className="w-4 h-4" /> WhatsApp
                  </a>
                )}
                {/* Plano Gratuito: exibe só o botão de mensagem */}
                {!showContacts && whatsappLink && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-400 font-semibold text-sm border border-dashed border-gray-300 cursor-not-allowed"
                    title="Disponível a partir do plano Essencial">
                    <Phone className="w-4 h-4" /> WhatsApp
                  </div>
                )}
                <Link href={`/mensagens?para=${id}`}
                  id={`message-profile-${id}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:brightness-110 hover:shadow-md"
                  style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                  <MessageCircle className="w-4 h-4" /> Mensagem
                </Link>
              </div>
            </div>
          </div>

          {/* Categoria */}
          {typedProfile.category_name && (
            <div className="mb-4">
              <span className={cn('inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full', colors.badge)}>
                {typedProfile.category_name}
                {typedProfile.subcategory_name && ` · ${typedProfile.subcategory_name}`}
              </span>
            </div>
          )}

          {visibleServiceSegments.length > 0 && (
            <section className="mb-5" aria-labelledby="profile-service-segments">
              <h2 id="profile-service-segments" className="mb-2 text-sm font-bold text-gray-800">Tipo de atendimento</h2>
              <div className="flex flex-wrap gap-2">
                {visibleServiceSegments.map((segment) => (
                  <div key={segment.categoryName} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-sm font-semibold text-gray-800">{segment.categoryName}</p>
                    <p className="text-xs text-gray-600">
                      {segment.serviceAudiences.map((audience) =>
                        audience === 'commercial' ? 'Empresas (comercial)' : 'Residencial',
                      ).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Selos */}
          <div className="flex flex-wrap gap-2 mb-4">
            {typedProfile.is_verified && (
              <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border text-blue-600 bg-blue-50 border-blue-200">
                <BadgeCheck className="w-4 h-4" /> Verificado
              </div>
            )}
            {plan === 'Profissional' && (
              <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border text-blue-700 bg-blue-50 border-blue-200">
                <Star className="w-4 h-4" /> Profissional
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border text-green-600 bg-green-50 border-green-200"
              title="Negociações protegidas dentro da plataforma">
              <Lock className="w-4 h-4" /> Seguro
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border text-purple-600 bg-purple-50 border-purple-200"
              title="Garantia de qualidade">
              <Award className="w-4 h-4" /> Garantia
            </div>
          </div>

          {/* Bio */}
          {typedProfile.bio && (
            <p className="text-gray-600 leading-relaxed border-t border-gray-50 pt-4">{typedProfile.bio}</p>
          )}

          {visibleServiceHours.length > 0 && (
            <section className="mt-4 border-t border-gray-50 pt-4" aria-labelledby="profile-service-hours">
              <h2 id="profile-service-hours" className="mb-3 text-sm font-bold text-gray-800">Horário de atendimento</h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                {visibleServiceHours.map((day) => (
                  <div key={day.key} className="flex justify-between gap-4 rounded-lg bg-gray-50 px-3 py-2">
                    <dt className="font-medium text-gray-700">{day.label}</dt>
                    <dd className="text-gray-600">
                      {day.closed ? 'Fechado' : `${day.open}–${day.close}`}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Links sociais — condicionais ao plano */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50 mt-4">
            {/* Gratuito: apenas 1 botão social */}
            {!showContacts ? (
              <>
                {(typedProfile.website_url || typedProfile.instagram_url || typedProfile.email_public || typedProfile.tiktok_url) && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Contatos visíveis a partir do plano <strong>Essencial</strong></span>
                  </div>
                )}
                {/* Mostra apenas o primeiro disponível */}
                {typedProfile.website_url && (
                  <a href={typedProfile.website_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline">
                    <Globe className="w-4 h-4" /> Site
                  </a>
                )}
              </>
            ) : (
              /* Essencial+: todos os contatos */
              <>
                {typedProfile.website_url && (
                  <a href={typedProfile.website_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline">
                    <Globe className="w-4 h-4" /> Site
                  </a>
                )}
                {typedProfile.instagram_url && (
                  <a href={`https://instagram.com/${typedProfile.instagram_url.replace('@', '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-pink-600 font-medium hover:underline">
                    <AtSign className="w-4 h-4" /> {typedProfile.instagram_url}
                  </a>
                )}
                {typedProfile.tiktok_url && (
                  <a href={typedProfile.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-gray-800 font-medium hover:underline">
                    <span className="text-xs font-black">TT</span> TikTok
                  </a>
                )}
                {typedProfile.email_public && (
                  <a href={`mailto:${typedProfile.email_public}`}
                    className="flex items-center gap-1.5 text-sm text-gray-600 font-medium hover:underline">
                    <Mail className="w-4 h-4" /> {typedProfile.email_public}
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {galleryImages.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 text-xl font-black text-gray-900">
            Fotos de {typedProfile.business_name || typedProfile.full_name}
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {galleryImages.map((image, index) => (
              <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
                <Image
                  src={image.url}
                  alt={`Foto ${index + 1} de ${typedProfile.business_name || typedProfile.full_name}`}
                  width={1200}
                  height={900}
                  unoptimized
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== ANÚNCIOS DO PERFIL ===== */}
      {listings.length > 0 && (
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4">
            Ofertas de {typedProfile.business_name || typedProfile.full_name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
