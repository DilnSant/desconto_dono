'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, AlertCircle, CheckCircle2, ChevronDown, Calendar, DollarSign, Tag, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/supabase/db'
import { CATEGORIES_STATIC } from '@/lib/constants/categories'
import { normalizeBenefitLocation } from '@/lib/benefits/location'

export default function NovoBeneficioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [discountType, setDiscountType] = useState<'pct' | 'val'>('pct')

  const [form, setForm] = useState({
    title: '', description: '', discount_pct: '',
    discount_val: '', link_url: '', whatsapp: '',
    category_id: '', valid_until: '', location_city: '', location_state: '',
  })

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
      else setLoading(false)
    }
    check()
  }, [router])

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.category_id) {
      setError('Preencha título, descrição e categoria'); return
    }
    setSubmitting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const location = normalizeBenefitLocation(form.location_city, form.location_state)
    const { error: err } = await db.from('benefits').insert({
      author_id: user.id,
      title: form.title,
      description: form.description,
      discount_pct: discountType === 'pct' && form.discount_pct ? parseInt(form.discount_pct) : null,
      discount_val: discountType === 'val' && form.discount_val ? parseFloat(form.discount_val) : null,
      link_url: form.link_url || null,
      whatsapp: form.whatsapp || null,
      category_id: form.category_id || null,
      location_city: location.location_city,
      location_state: location.location_state,
      valid_until: form.valid_until || null,
      is_active: true,
    })

    if (err) { setError('Erro ao publicar. Tente novamente.') }
    else {
      setSuccess(true)
      setTimeout(() => router.push('/beneficios'), 1500)
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Oferecer Benefício</h1>
        <p className="text-gray-500 text-sm mt-1">Compartilhe um desconto com a comunidade <strong>Desconto do Dono</strong></p>
      </div>

      {success && (
        <div className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 mb-6">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div><p className="font-bold">Benefício publicado!</p><p className="text-sm">Redirecionando...</p></div>
        </div>
      )}

      <form id="benefit-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-green-600" /> Informações
          </h2>
          <div>
            <input id="b-title" value={form.title} onChange={e => update('title', e.target.value)}
              maxLength={80} placeholder="Título do benefício *"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <textarea id="b-description" value={form.description} onChange={e => update('description', e.target.value)}
              rows={3} maxLength={400} placeholder="Descreva o benefício, condições e como resgatar *"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          <div className="relative">
            <select id="b-category" value={form.category_id} onChange={e => update('category_id', e.target.value)}
              className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
              <option value="">Categoria *</option>
              {CATEGORIES_STATIC.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-green-600" /> Atendimento presencial
          </h2>
          <p className="text-xs text-gray-500">
            Informe a localização quando o benefício depender de atendimento presencial.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="b-city" className="block text-xs font-semibold text-gray-600 mb-1.5">Cidade (opcional)</label>
              <input id="b-city" type="text" value={form.location_city}
                onChange={e => update('location_city', e.target.value)}
                maxLength={100} placeholder="Ex.: Curitiba"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label htmlFor="b-state" className="block text-xs font-semibold text-gray-600 mb-1.5">Estado (UF)</label>
              <input id="b-state" type="text" value={form.location_state}
                onChange={e => update('location_state', e.target.value)}
                maxLength={2} placeholder="Ex.: PR"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-green-600" /> Desconto
          </h2>
          <div className="flex gap-2">
            {[{ value: 'pct', label: '% Percentual' }, { value: 'val', label: 'R$ Valor Fixo' }].map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setDiscountType(opt.value as 'pct' | 'val')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${discountType === opt.value ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                style={discountType === opt.value ? { background: 'linear-gradient(135deg, #009B3A, #005C2D)' } : {}}>
                {opt.label}
              </button>
            ))}
          </div>
          {discountType === 'pct' ? (
            <input id="b-pct" type="number" min="1" max="100" value={form.discount_pct}
              onChange={e => update('discount_pct', e.target.value)}
              placeholder="Ex: 30 (para 30% de desconto)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          ) : (
            <input id="b-val" type="number" step="0.01" min="0" value={form.discount_val}
              onChange={e => update('discount_val', e.target.value)}
              placeholder="Ex: 200.00 (R$ 200,00 de desconto)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-green-600" /> Contato e Validade
          </h2>
          <input id="b-whatsapp" type="tel" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)}
            placeholder="WhatsApp para resgate (ex: 11999999999)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <input id="b-link" type="url" value={form.link_url} onChange={e => update('link_url', e.target.value)}
            placeholder="Link do site (opcional)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Válido até (opcional)</label>
            <input id="b-valid" type="date" value={form.valid_until} onChange={e => update('valid_until', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button id="btn-publish-benefit" type="submit" disabled={submitting || success}
          className="w-full py-4 rounded-2xl text-white font-black text-base transition-all hover:brightness-110 hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Publicando...</> : <><Plus className="w-5 h-5" /> Publicar Benefício</>}
        </button>
      </form>
    </div>
  )
}
