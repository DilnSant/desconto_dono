'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Camera, Upload, X, ChevronDown, Loader2, AlertCircle,
  CheckCircle2, DollarSign, FileText, Tag, MapPin, Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/supabase/db'
import { CATEGORIES_STATIC, ESTADOS_BR } from '@/lib/constants/categories'
import type { Profile } from '@/types/database'

export default function NovoAnuncioPage() {
  const router = useRouter()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    price_type: 'fixed',
    category_id: '',
    subcategory_id: '',
    location_city: '',
    location_state: '',
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const selectedCategory = CATEGORIES_STATIC.find((c) => c.id === form.category_id)
  const subcategories = selectedCategory?.subcategories || []

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await db
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setForm((prev) => ({
          ...prev,
          location_city: data.city || '',
          location_state: data.state || '',
          category_id: data.category_id || '',
          subcategory_id: data.subcategory_id || '',
        }))
      }
      setLoading(false)
    }
    init()
  }, [router])

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value, ...(field === 'category_id' ? { subcategory_id: '' } : {}) }))

  const handleImageSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setError('Imagem deve ter no máximo 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) { setError('Informe o título do anúncio'); return }
    if (!form.category_id) { setError('Selecione uma categoria'); return }
    if (!form.location_city) { setError('Informe a cidade'); return }
    if (!form.location_state) { setError('Selecione o estado'); return }

    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    let image_url: string | null = null

    // Upload da imagem
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(path, imageFile, { upsert: true })

      if (!uploadError) {
        const { data } = supabase.storage.from('listings').getPublicUrl(path)
        image_url = data.publicUrl
      }
    }

    const { data: listing, error: insertError } = await db
      .from('listings')
      .insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price_type !== 'free' && form.price ? parseFloat(form.price) : null,
        price_type: form.price_type,
        category_id: form.category_id || null,
        subcategory_id: form.subcategory_id || null,
        location_city: form.location_city,
        location_state: form.location_state,
        image_url,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      setError('Erro ao publicar anúncio. Tente novamente.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push(`/anuncio/${listing.id}`), 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Novo Anúncio</h1>
        <p className="text-gray-500 mt-1">Publique seus serviços e alcance clientes em todo o Brasil</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 mb-6">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Anúncio publicado com sucesso!</p>
            <p className="text-sm text-green-600">Redirecionando...</p>
          </div>
        </div>
      )}

      <form id="listing-form" onSubmit={handleSubmit} className="space-y-5">

        {/* ===== IMAGEM ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-600" /> Foto do Anúncio
          </h2>

          {imagePreview ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden group">
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              <button type="button" onClick={() => { setImagePreview(null); setImageFile(null) }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="btn-upload-image"
              onClick={() => imageInputRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-green-400 hover:text-green-600 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 group-hover:bg-green-50 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">Clique para adicionar foto</p>
                <p className="text-xs mt-0.5">JPG, PNG ou WebP · Máx. 5MB</p>
              </div>
            </button>
          )}
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
        </div>

        {/* ===== INFORMAÇÕES BÁSICAS ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" /> Informações
          </h2>

          <div>
            <label htmlFor="a-title" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Título do Anúncio *
            </label>
            <input id="a-title" value={form.title} onChange={(e) => update('title', e.target.value)}
              maxLength={100} placeholder="Ex: Desenvolvimento de Sites Profissionais"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            <p className="text-right text-xs text-gray-400 mt-1">{form.title.length}/100</p>
          </div>

          <div>
            <label htmlFor="a-description" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Descrição
            </label>
            <textarea id="a-description" value={form.description} onChange={(e) => update('description', e.target.value)}
              rows={5} maxLength={1000} placeholder="Descreva detalhadamente o que você oferece, seus diferenciais, prazo de entrega, etc."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none" />
            <p className="text-right text-xs text-gray-400 mt-1">{form.description.length}/1000</p>
          </div>
        </div>

        {/* ===== CATEGORIA ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-green-600" /> Categoria
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="a-category" className="block text-sm font-semibold text-gray-700 mb-1.5">Categoria *</label>
              <div className="relative">
                <select id="a-category" value={form.category_id} onChange={(e) => update('category_id', e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white">
                  <option value="">Selecione</option>
                  {CATEGORIES_STATIC.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {subcategories.length > 0 && (
              <div>
                <label htmlFor="a-subcategory" className="block text-sm font-semibold text-gray-700 mb-1.5">Subcategoria</label>
                <div className="relative">
                  <select id="a-subcategory" value={form.subcategory_id} onChange={(e) => update('subcategory_id', e.target.value)}
                    className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white">
                    <option value="">Selecione</option>
                    {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== PREÇO ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" /> Preço
          </h2>

          {/* Tipo de preço */}
          <div className="flex gap-2">
            {[
              { value: 'fixed', label: 'Fixo' },
              { value: 'negotiable', label: 'Negociável' },
              { value: 'free', label: 'Grátis' },
            ].map((opt) => (
              <button key={opt.value} type="button"
                id={`price-type-${opt.value}`}
                onClick={() => update('price_type', opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  form.price_type === opt.value
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={form.price_type === opt.value ? { background: 'linear-gradient(135deg, #009B3A, #005C2D)' } : {}}>
                {opt.label}
              </button>
            ))}
          </div>

          {form.price_type === 'fixed' && (
            <div>
              <label htmlFor="a-price" className="block text-sm font-semibold text-gray-700 mb-1.5">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">R$</span>
                <input id="a-price" type="number" step="0.01" min="0" value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
              </div>
            </div>
          )}
        </div>

        {/* ===== LOCALIZAÇÃO ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" /> Localização
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="a-city" className="block text-sm font-semibold text-gray-700 mb-1.5">Cidade *</label>
              <input id="a-city" value={form.location_city} onChange={(e) => update('location_city', e.target.value)}
                placeholder="Cidade do serviço"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            <div>
              <label htmlFor="a-state" className="block text-sm font-semibold text-gray-700 mb-1.5">Estado *</label>
              <div className="relative">
                <select id="a-state" value={form.location_state} onChange={(e) => update('location_state', e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white">
                  <option value="">Selecione</option>
                  {ESTADOS_BR.map((e) => <option key={e.sigla} value={e.sigla}>{e.nome} ({e.sigla})</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Ao publicar, você confirma que o anúncio está de acordo com nossos{' '}
            <a href="/termos" className="underline font-medium">Termos de Uso</a>.
            Anúncios enganosos serão removidos.
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Botão publicar */}
        <button id="btn-publish" type="submit" disabled={submitting || success}
          className="w-full py-4 rounded-2xl text-white font-black text-base transition-all hover:brightness-110 hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
          {submitting
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Publicando...</>
            : success
              ? <><CheckCircle2 className="w-5 h-5" /> Publicado!</>
              : 'Publicar Anúncio Grátis'
          }
        </button>
      </form>
    </div>
  )
}
