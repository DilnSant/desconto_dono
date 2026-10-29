'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle2, Phone, User, Tag } from 'lucide-react'
import { db } from '@/lib/supabase/db'

interface LeadCaptureModalProps {
  offerId: string
  offerTitle: string
  businessName: string
  onClose: () => void
}

export default function LeadCaptureModal({
  offerId,
  offerTitle,
  businessName,
  onClose,
}: LeadCaptureModalProps) {
  const [form, setForm] = useState({ client_name: '', client_whatsapp: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const formatWpp = (v: string) => v.replace(/\D/g, '').slice(0, 11)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_name.trim() || !form.client_whatsapp.trim()) {
      setError('Preencha seu nome e WhatsApp para resgatar.')
      return
    }
    if (form.client_whatsapp.replace(/\D/g, '').length < 10) {
      setError('WhatsApp inválido. Informe DDD + número.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { error: dbErr } = await db.from('leads').insert({
        offer_id: offerId,
        client_name: form.client_name.trim(),
        client_whatsapp: form.client_whatsapp.replace(/\D/g, ''),
      })
      if (dbErr) throw dbErr
      setSuccess(true)
    } catch {
      setError('Erro ao registrar. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        style={{ background: '#fff' }}
      >
        {/* Header com gradiente Brasil */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #009B3A 33%, #FEDF00 33%, #FEDF00 66%, #002776 66%)' }} />
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, #005C2D 0%, #009B3A 100%)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 text-xs font-bold uppercase tracking-wider">Resgatar Desconto</span>
            </div>
            <h2 className="text-white font-black text-lg leading-snug">{offerTitle}</h2>
            <p className="text-white/70 text-sm mt-0.5">por {businessName}</p>
          </div>
          <button
            id="close-lead-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-colors shrink-0 mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            /* Estado de Sucesso */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-gray-900 font-black text-xl mb-2">Oferta Registrada! 🎉</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                A empresa <strong className="text-gray-800">{businessName}</strong> vai entrar em contato pelo seu WhatsApp em breve.
              </p>
              <button
                id="close-lead-success"
                onClick={onClose}
                className="w-full py-3 rounded-2xl font-bold text-green-950 transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
              >
                Fechar
              </button>
            </div>
          ) : (
            /* Formulário */
            <form id="lead-capture-form" onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                Informe seus dados e a empresa entrará em contato para confirmar o desconto.
              </p>

              {/* Nome */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="lead-name"
                  type="text"
                  required
                  value={form.client_name}
                  onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))}
                  placeholder="Seu nome completo *"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                />
              </div>

              {/* WhatsApp */}
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="lead-whatsapp"
                  type="tel"
                  required
                  value={form.client_whatsapp}
                  onChange={(e) => setForm((p) => ({ ...p, client_whatsapp: formatWpp(e.target.value) }))}
                  placeholder="WhatsApp com DDD (ex: 11999998888) *"
                  maxLength={11}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <p className="text-xs text-gray-400">
                🔒 Seus dados são usados apenas para a empresa te contatar. LGPD compliant.
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  id="lead-submit"
                  type="submit"
                  disabled={loading}
                  className="flex-2 flex-grow-[2] flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-green-950 text-sm transition-all hover:brightness-110 hover:shadow-lg disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
                  ) : (
                    '🎁 Resgatar Desconto'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
