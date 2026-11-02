'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  BadgeCheck, Globe, AtSign, Phone, Mail,
  MapPin, MessageCircle, ExternalLink, Lock
} from 'lucide-react'
import { getInitials, formatWhatsAppLink } from '@/lib/utils/helpers'
import { CATEGORY_COLOR_MAP, CATEGORIES_STATIC } from '@/lib/constants/categories'
import type { PublicProfileCardData } from '@/types/database'
import type { PlanType } from '@/types/database'
import { cn } from '@/lib/utils/helpers'
import { normalizeStoredPlanType } from '@/lib/plans/entitlements'

interface ProfileCardProps {
  profile: PublicProfileCardData
  compact?: boolean
  coverageLabel?: string
}

function PlanBadge({ plan }: { plan: PlanType }) {
  const map: Record<PlanType, { label: string; cls: string }> = {
    Gratuito:     { label: 'Gratuito', cls: 'text-gray-500 bg-gray-100 border-gray-200' },
    Essencial:    { label: 'Essencial', cls: 'text-blue-600 bg-blue-50 border-blue-200' },
    Profissional: { label: 'Profissional', cls: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  }
  const { label, cls } = map[plan] || map['Gratuito']
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide', cls)}>
      {label}
    </span>
  )
}

export default function ProfileCard({ profile, compact, coverageLabel }: ProfileCardProps) {
  const category = CATEGORIES_STATIC.find((item) => item.id === profile.category_id)
  const colors = CATEGORY_COLOR_MAP[category?.color || 'neutral']
  const plan = normalizeStoredPlanType(profile.plan_type || 'Gratuito')
  const isProfessional = plan === 'Profissional'
  const isEssential = plan === 'Essencial' || isProfessional

  const whatsappLink = isEssential && profile.public_whatsapp
    ? formatWhatsAppLink(profile.public_whatsapp, 'Olá, vi seu perfil no Desconto do Dono!')
    : null

  return (
    <article
      id={`profile-${profile.id}`}
      className={cn(
        'bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden',
        'border-gray-100'
      )}
    >
      {/* Capa */}
      <div className="relative h-24 overflow-hidden">
        <div className="h-full w-full" style={{
          background: 'linear-gradient(135deg, #009B3A 0%, #005C2D 50%, #002776 100%)'
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Avatar flutuante */}
      <div className="relative px-4 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-3">
          <div className="relative">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={72}
                height={72}
                className="rounded-2xl border-4 border-white shadow-md object-cover"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-black"
                style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                {getInitials(profile.business_name || profile.full_name)}
              </div>
            )}
            {profile.is_verified && (
              <div className="absolute -bottom-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow">
                <BadgeCheck className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>

          {/* Ações rápidas */}
          {!compact && (
            <div className="flex gap-2">
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  id={`whatsapp-${profile.id}`}
                  className="p-2 rounded-xl text-white transition-all hover:scale-105 hover:shadow-md"
                  style={{ background: '#25D366' }}
                  title="WhatsApp"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
              <Link
                href={`/mensagens?para=${profile.id}`}
                id={`message-${profile.id}`}
                className="p-2 rounded-xl text-white transition-all hover:scale-105 hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}
                title="Enviar mensagem"
              >
                <MessageCircle className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Nome + badges */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-black text-gray-900 text-base leading-tight">
              {profile.business_name || profile.full_name}
            </h3>
          </div>
          {profile.business_name && (
            <p className="text-gray-500 text-sm">{profile.full_name}</p>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <MapPin className="w-3 h-3" />
            <span>{profile.city}, {profile.state}</span>
          </div>
          {coverageLabel && (
            <p className="mt-1 text-xs font-semibold text-[#005c2d]">{coverageLabel}</p>
          )}
        </div>

        {/* Badge de plano */}
        <div className="mb-2">
          <PlanBadge plan={plan} />
        </div>

        {/* Categoria */}
        {profile.category_name && (
          <span className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full mb-3',
            colors.badge
          )}>
            {profile.category_name}
            {profile.subcategory_name && ` · ${profile.subcategory_name}`}
          </span>
        )}

        {/* Bio */}
        {profile.bio && !compact && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">
            {profile.bio}
          </p>
        )}

        {/* Selos de verificação */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {profile.is_verified && (
            <div title="Perfil verificado pela equipe Desconto do Dono"
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border text-blue-600 bg-blue-50 border-blue-200">
              <BadgeCheck className="w-3 h-3" />
              <span>Verificado</span>
            </div>
          )}
          <div title="Negociações protegidas dentro da plataforma"
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border text-green-600 bg-green-50 border-green-200">
            <Lock className="w-3 h-3" />
            <span>Seguro</span>
          </div>
        </div>

        {/* Links sociais — visíveis apenas para Essencial+ */}
        {!compact && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
            {/* Site — liberado para Essencial+ */}
            {isEssential && profile.website_url ? (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <Globe className="w-3 h-3" /> Site
              </a>
            ) : !isEssential && profile.website_url ? (
              <span className="flex items-center gap-1 text-xs text-gray-300 cursor-not-allowed" title="Visível no plano Essencial+">
                <Lock className="w-3 h-3" /> Site
              </span>
            ) : null}

            {/* Instagram — Essencial+ */}
            {isEssential && profile.instagram_url ? (
              <a href={`https://instagram.com/${profile.instagram_url.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-pink-600 hover:underline">
                <AtSign className="w-3 h-3" /> Instagram
              </a>
            ) : null}

            {/* TikTok — Essencial+ */}
            {isEssential && profile.tiktok_url ? (
              <a href={`https://tiktok.com/@${profile.tiktok_url.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-black hover:underline">
                <AtSign className="w-3 h-3" /> TikTok
              </a>
            ) : null}

            {/* E-mail — Essencial+ */}
            {isEssential && profile.email_public ? (
              <a href={`mailto:${profile.email_public}`}
                className="flex items-center gap-1 text-xs text-gray-600 hover:underline">
                <Mail className="w-3 h-3" /> E-mail
              </a>
            ) : null}

            <Link
              href={`/perfil/${profile.id}`}
              id={`view-profile-${profile.id}`}
              className="ml-auto flex items-center gap-1 text-xs text-green-700 font-semibold hover:underline"
            >
              Ver perfil <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
