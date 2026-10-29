'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tag, MessageCircle, Phone } from 'lucide-react'
import LeadCaptureModal from '@/components/ui/LeadCaptureModal'

interface AnuncioClientActionsProps {
  listingId: string
  listingTitle: string
  businessName: string
  whatsappLink: string | null
  profileUserId: string
}

export default function AnuncioClientActions({
  listingId,
  listingTitle,
  businessName,
  whatsappLink,
  profileUserId,
}: AnuncioClientActionsProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* CTA Principal: Resgatar Desconto */}
        <button
          id="btn-resgatar-desconto"
          onClick={() => setModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-base transition-all hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #005C2D 0%, #009B3A 100%)' }}
        >
          <Tag className="w-5 h-5 text-yellow-400" />
          Resgatar Desconto
        </button>

        {/* Botão secundário: Mensagem na plataforma */}
        <Link
          href={`/mensagens?para=${profileUserId}&anuncio=${listingId}`}
          id="btn-send-message"
          className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-semibold text-gray-700 text-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <MessageCircle className="w-5 h-5" /> Mensagem
        </Link>

        {/* WhatsApp direto (se disponível) */}
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            id="btn-whatsapp-listing"
            className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-semibold text-white text-sm hover:brightness-110 transition-all"
            style={{ background: '#25D366' }}
          >
            <Phone className="w-5 h-5" />
          </a>
        )}
      </div>

      {/* Modal de Captura de Lead */}
      {modalOpen && (
        <LeadCaptureModal
          offerId={listingId}
          offerTitle={listingTitle}
          businessName={businessName}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
