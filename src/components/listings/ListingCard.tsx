'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Eye, Shield, BadgeCheck, Crown, Tag } from 'lucide-react'
import { formatCurrency, formatRelativeDate, getInitials, truncate } from '@/lib/utils/helpers'
import { CATEGORY_COLOR_MAP } from '@/lib/constants/categories'
import type { ListingWithProfile } from '@/types/database'
import { cn } from '@/lib/utils/helpers'

interface ListingCardProps {
  listing: ListingWithProfile
}

export default function ListingCard({ listing }: ListingCardProps) {
  const colors = CATEGORY_COLOR_MAP[listing.categories?.color || 'neutral']
  const plan = (listing.profiles as { plan_type?: string })?.plan_type || 'Gratuito'
  const isProfOrPremium = plan === 'Profissional' || plan === 'Premium'
  const isPremium = plan === 'Premium'

  return (
    <article
      id={`listing-${listing.id}`}
      className={cn(
        'group bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col',
        isProfOrPremium
          ? 'border-yellow-300 ring-2 ring-yellow-400'
          : 'border-gray-100'
      )}
    >
      {/* Imagem */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {listing.image_url ? (
          <Image
            src={listing.image_url}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f0f9f0 0%, #e0f2e9 100%)' }}>
            <span className="text-5xl select-none opacity-30">🏷️</span>
          </div>
        )}

        {/* Badge de categoria */}
        {listing.categories && (
          <span className={cn(
            'absolute top-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm',
            colors.badge
          )}>
            {listing.categories.name}
          </span>
        )}

        {/* Badge de plano (Profissional/Premium) */}
        {isProfOrPremium && (
          <div className="absolute top-2 right-2">
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md',
              isPremium ? 'bg-yellow-400 text-yellow-900' : 'bg-blue-600 text-white'
            )}>
              {isPremium ? <Crown className="w-2.5 h-2.5" /> : <Tag className="w-2.5 h-2.5" />}
              {plan}
            </span>
          </div>
        )}

        {/* Badge de preço */}
        {listing.price !== null && (
          <div className="absolute bottom-2 right-2 bg-black/75 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm">
            {listing.price_type === 'free'
              ? 'Grátis'
              : listing.price_type === 'negotiable'
                ? 'Negociável'
                : formatCurrency(listing.price)}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Título */}
        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
          {listing.title}
        </h3>

        {/* Descrição */}
        {listing.description && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
            {listing.description}
          </p>
        )}

        {/* Perfil do anunciante */}
        <div className="flex items-center gap-2 py-2 border-t border-b border-gray-50">
          <div className="relative">
            {listing.profiles?.avatar_url ? (
              <Image
                src={listing.profiles.avatar_url}
                alt={listing.profiles.full_name}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                {getInitials(listing.profiles?.business_name || listing.profiles?.full_name || 'DD')}
              </div>
            )}
            {listing.profiles?.is_verified && (
              <BadgeCheck className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500 bg-white rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1">
              {listing.profiles?.business_name || listing.profiles?.full_name}
              {/* Selo BadgeCheck azul para Premium */}
              {isPremium && (
                <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              )}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>{listing.profiles?.city}, {listing.profiles?.state}</span>
            </div>
          </div>
          {listing.profiles?.is_verified && (
            <div title="Perfil Verificado" className="shrink-0">
              <Shield className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>

        {/* Footer do card */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeDate(listing.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {listing.views}
            </span>
          </div>

          <Link
            href={`/anuncio/${listing.id}`}
            id={`view-listing-${listing.id}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}
          >
            Ver oferta
          </Link>
        </div>
      </div>
    </article>
  )
}
