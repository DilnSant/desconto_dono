'use client'

import { useState } from 'react'
import { BadgeCheck, Calendar, Tag, ExternalLink, Percent, DollarSign } from 'lucide-react'
import { getInitials } from '@/lib/utils/helpers'
import LeadCaptureModal from '@/components/ui/LeadCaptureModal'
import SponsorBanner from '@/components/ui/SponsorBanner'

// Cores por categoria
const CATEGORY_COLORS: Record<string, string> = {
  'Desenvolvedores': 'bg-slate-100 text-slate-700 border-slate-200',
  'Financeiras':     'bg-teal-100 text-teal-700 border-teal-200',
  'Marketing':       'bg-rose-100 text-rose-700 border-rose-200',
  'Beleza':          'bg-pink-100 text-pink-700 border-pink-200',
  'Gastronomia':     'bg-orange-100 text-orange-700 border-orange-200',
  'Saúde':           'bg-red-100 text-red-700 border-red-200',
  'Lazer':           'bg-green-100 text-green-700 border-green-200',
  'Ensino':          'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Veículos':        'bg-gray-100 text-gray-700 border-gray-200',
  'Hotelaria':       'bg-purple-100 text-purple-700 border-purple-200',
}

type BenefitItem = {
  id: string
  title: string
  description: string
  discount_pct: number | null
  discount_val: number | null
  author: string
  business: string
  category: string
  valid_until: string | null
  redemptions: number
  whatsapp: string | null
  avatar_url: string | null
  is_verified: boolean
  video_embed_url?: string | null
  link_url?: string | null
}

interface BeneficiosFeedProps {
  benefits: BenefitItem[]
}

export default function BeneficiosFeed({ benefits }: BeneficiosFeedProps) {
  const [activeModal, setActiveModal] = useState<{
    offerId: string
    offerTitle: string
    businessName: string
  } | null>(null)

  return (
    <>
      {/* Modal de captura de lead */}
      {activeModal && (
        <LeadCaptureModal
          offerId={activeModal.offerId}
          offerTitle={activeModal.offerTitle}
          businessName={activeModal.businessName}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Grid de benefícios + SponsorBanner após o 4º card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {benefits.map((benefit, index) => {
          const catColor = CATEGORY_COLORS[benefit.category] || 'bg-gray-100 text-gray-700 border-gray-200'

          return (
            <>
              {/* SponsorBanner inserido após o 4º card (index === 3) */}
              {index === 4 && (
                <SponsorBanner key="sponsor-mid-feed" variant="feed" />
              )}

              <div
                key={benefit.id}
                id={`benefit-card-${benefit.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col"
              >
                {/* Faixa Brasil */}
                <div className="relative h-1.5"
                  style={{ background: 'linear-gradient(90deg, #009B3A, #FEDF00, #002776)' }} />

                {/* Embed de vídeo (se houver) */}
                {benefit.video_embed_url && (
                  <div className="relative w-full aspect-video overflow-hidden bg-gray-100">
                    <iframe
                      src={benefit.video_embed_url}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={benefit.title}
                    />
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  {/* Header: categoria + desconto */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${catColor}`}>
                      <Tag className="w-3 h-3" /> {benefit.category}
                    </span>
                    <div className="text-right shrink-0">
                      {benefit.discount_pct && (
                        <span className="flex items-center gap-0.5 text-2xl font-black text-green-700">
                          <Percent className="w-4 h-4" />-{benefit.discount_pct}%
                        </span>
                      )}
                      {benefit.discount_val && (
                        <span className="flex items-center gap-0.5 text-xl font-black text-green-700">
                          <DollarSign className="w-4 h-4" />-R${benefit.discount_val}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-black text-gray-900 text-sm leading-tight mb-2">{benefit.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed flex-1 mb-4">{benefit.description}</p>

                  {/* Autor */}
                  <div className="flex items-center gap-2 mb-4 pt-3 border-t border-gray-50">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                      style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                      {getInitials(benefit.business || benefit.author)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {benefit.business || benefit.author}
                        </p>
                        {benefit.is_verified && (
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {benefit.valid_until && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            até {new Date(benefit.valid_until).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        <span className="text-gray-300">·</span>
                        <span>{benefit.redemptions} resgates</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA — botão "Resgatar Desconto" abre o Modal */}
                  <div className="flex gap-2">
                    <button
                      id={`btn-resgatar-${benefit.id}`}
                      onClick={() => setActiveModal({
                        offerId: benefit.id,
                        offerTitle: benefit.title,
                        businessName: benefit.business || benefit.author,
                      })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all hover:brightness-110 hover:shadow-md"
                      style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)', color: '#14532d' }}
                    >
                      🎁 Resgatar Desconto
                    </button>
                    {benefit.link_url && (
                      <a href={benefit.link_url} target="_blank" rel="noopener noreferrer"
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )
        })}
      </div>
    </>
  )
}
