import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  BadgeCheck, Shield, Star, Globe, AtSign, Phone, Mail,
  MapPin, MessageCircle, Lock, Award, ArrowLeft, Calendar,
  Video, Crown
} from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerDb } from '@/lib/supabase/server-db'
import { formatDate, formatWhatsAppLink, getInitials } from '@/lib/utils/helpers'
import { CATEGORY_COLOR_MAP } from '@/lib/constants/categories'
import ListingCard from '@/components/listings/ListingCard'
import type { ListingWithProfile, ProfileWithCategory, PlanType } from '@/types/database'
import { cn } from '@/lib/utils/helpers'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await getServerDb()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, business_name, bio, city, state')
    .eq('id', id)
    .single()

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
  return plan === 'Essencial' || plan === 'Profissional' || plan === 'Premium'
}
function canShowVideo(plan: PlanType) {
  return plan === 'Profissional' || plan === 'Premium'
}
function isPremium(plan: PlanType) {
  return plan === 'Premium'
}
function maxVideos(plan: PlanType): number {
  if (plan === 'Premium') return 3
  if (plan === 'Profissional') return 1
  return 0
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await getServerDb()

  const [{ data: profile }, { data: listingsRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, categories(*), subcategories(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('listings')
      .select(`*, profiles:user_id(id, full_name, business_name, avatar_url, city, state, is_verified, plan_type), categories:category_id(name, color, slug)`)
      .eq('user_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  if (!profile) notFound()

  const typedProfile = profile as ProfileWithCategory
  const listings = (listingsRaw || []) as ListingWithProfile[]
  const colors = CATEGORY_COLOR_MAP[typedProfile.categories?.color || 'neutral']
  const plan = (typedProfile.plan_type as PlanType) || 'Gratuito'

  const whatsappLink = typedProfile.whatsapp
    ? formatWhatsAppLink(typedProfile.whatsapp, `Olá ${typedProfile.business_name || typedProfile.full_name}, vi seu perfil no Desconto do Dono!`)
    : null

  // Vídeos para exibir (limitado pelo plano)
  const videoUrls: string[] = []
  if (canShowVideo(plan)) {
    // Coleta video_embed_url dos listings activos
    const lVideos = listings
      .filter((l) => l.video_embed_url)
      .slice(0, maxVideos(plan))
      .map((l) => l.video_embed_url as string)
    videoUrls.push(...lVideos)
  }

  const isPremiumUser = isPremium(plan)
  const showContacts = canShowContacts(plan)
  const isProfOrPremium = canShowVideo(plan)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Voltar */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-700 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* ===== VÍDEO EMBED (Profissional/Premium) no TOPO ===== */}
      {videoUrls.length > 0 && (
        <div className="mb-6 space-y-4">
          {videoUrls.map((url, i) => (
            <div key={i} className="rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              <iframe
                src={url}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`Vídeo ${i + 1} de ${typedProfile.business_name || typedProfile.full_name}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* ===== HERO DO PERFIL ===== */}
      <div className={cn(
        'bg-white rounded-3xl border shadow-sm overflow-hidden mb-6',
        isProfOrPremium ? 'border-yellow-300 ring-2 ring-yellow-400' : 'border-gray-100'
      )}>
        {/* Capa */}
        <div className="relative h-48 md:h-64">
          {typedProfile.cover_url ? (
            <Image src={typedProfile.cover_url} alt="Capa" fill className="object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #005C2D 0%, #009B3A 50%, #002776 100%)' }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Badge de plano no topo da capa */}
          {plan !== 'Gratuito' && (
            <div className="absolute top-4 right-4">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-lg',
                plan === 'Premium' ? 'text-white bg-gradient-to-r from-yellow-500 to-yellow-600' :
                plan === 'Profissional' ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700' :
                'text-gray-800 bg-yellow-100'
              )}>
                {plan === 'Premium' ? <Crown className="w-3 h-3" /> :
                 plan === 'Profissional' ? <Video className="w-3 h-3" /> :
                 <Star className="w-3 h-3" />}
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
                  {/* Selo BadgeCheck azul para Premium */}
                  {isPremiumUser && (
                    <span title="Empresa Verificada Premium" aria-label="Empresa Verificada Premium">
                      <BadgeCheck className="w-7 h-7 text-blue-500" />
                    </span>
                  )}
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
          {typedProfile.categories && (
            <div className="mb-4">
              <span className={cn('inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full', colors.badge)}>
                {typedProfile.categories.name}
                {typedProfile.subcategories && ` · ${typedProfile.subcategories.name}`}
              </span>
            </div>
          )}

          {/* Selos */}
          <div className="flex flex-wrap gap-2 mb-4">
            {typedProfile.is_verified && (
              <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border text-blue-600 bg-blue-50 border-blue-200">
                <BadgeCheck className="w-4 h-4" /> Verificado
              </div>
            )}
            {isPremiumUser && (
              <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border text-yellow-700 bg-yellow-50 border-yellow-200">
                <Crown className="w-4 h-4" /> Premium
              </div>
            )}
            {plan === 'Profissional' && (
              <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border text-blue-700 bg-blue-50 border-blue-200">
                <Video className="w-4 h-4" /> Profissional
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
