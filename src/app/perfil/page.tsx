'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Camera, Save, Loader2, AlertCircle, CheckCircle2,
  Globe, AtSign, Phone, Mail, MapPin, ChevronDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/supabase/db'
import { CATEGORIES_STATIC, ESTADOS_BR } from '@/lib/constants/categories'
import { getInitials } from '@/lib/utils/helpers'
import type { ProfileWithCategory } from '@/types/database'

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileWithCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    full_name: '', business_name: '', bio: '', city: '',
    state: '', website_url: '', instagram_url: '',
    email_public: '', whatsapp: '', category_id: '', subcategory_id: '',
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const selectedCategory = CATEGORIES_STATIC.find((c) => c.id === form.category_id)
  const subcategories = selectedCategory?.subcategories || []

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await db
        .from('profiles')
        .select('*, categories(*), subcategories(*)')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data as ProfileWithCategory)
        setForm({
          full_name: data.full_name || '',
          business_name: data.business_name || '',
          bio: data.bio || '',
          city: data.city || '',
          state: data.state || '',
          website_url: data.website_url || '',
          instagram_url: data.instagram_url || '',
          email_public: data.email_public || '',
          whatsapp: data.whatsapp || '',
          category_id: data.category_id || '',
          subcategory_id: data.subcategory_id || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [router])

  const handleImageSelect = (file: File, type: 'avatar' | 'cover') => {
    const url = URL.createObjectURL(file)
    if (type === 'avatar') { setAvatarFile(file); setAvatarPreview(url) }
    else { setCoverFile(file); setCoverPreview(url) }
  }

  const uploadImage = async (file: File, bucket: string, userId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    let avatar_url = profile?.avatar_url
    let cover_url = profile?.cover_url

    if (avatarFile) avatar_url = await uploadImage(avatarFile, 'avatars', user.id) || avatar_url
    if (coverFile) cover_url = await uploadImage(coverFile, 'covers', user.id) || cover_url

    const { error: updateError } = await db
      .from('profiles')
      .update({
        full_name: form.full_name,
        business_name: form.business_name || null,
        bio: form.bio || null,
        city: form.city,
        state: form.state,
        website_url: form.website_url || null,
        instagram_url: form.instagram_url || null,
        email_public: form.email_public || null,
        whatsapp: form.whatsapp || null,
        category_id: form.category_id || null,
        subcategory_id: form.subcategory_id || null,
        avatar_url,
        cover_url,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Erro ao salvar perfil. Tente novamente.')
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value, ...(field === 'category_id' ? { subcategory_id: '' } : {}) }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Meu Perfil</h1>
      <p className="text-gray-500 mb-8">Personalize como você aparece na plataforma</p>

      <form id="profile-form" onSubmit={handleSave} className="space-y-6">

        {/* ===== FOTOS ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Capa */}
          <div className="relative h-40 group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
            {(coverPreview || profile?.cover_url) ? (
              <Image src={coverPreview || profile!.cover_url!} alt="Capa" fill className="object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #009B3A, #002776)' }} />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Camera className="w-5 h-5" /> Alterar capa
              </div>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], 'cover')} />
          </div>

          {/* Avatar */}
          <div className="px-6 pb-6 -mt-10 flex items-end justify-between">
            <div className="relative cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
              {(avatarPreview || profile?.avatar_url) ? (
                <Image src={avatarPreview || profile!.avatar_url!} alt="Avatar" width={88} height={88}
                  className="rounded-2xl border-4 border-white shadow-lg object-cover" />
              ) : (
                <div className="w-22 w-[88px] h-[88px] rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-black"
                  style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                  {getInitials(form.full_name || 'ON')}
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], 'avatar')} />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Clique nas imagens para alterar</p>
              {(profile?.is_verified) && (
                <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Perfil Verificado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ===== DADOS BÁSICOS ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-black text-gray-800 text-lg">Dados Básicos</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-fullname" className="label-field">Nome Completo *</label>
              <input id="p-fullname" value={form.full_name} onChange={(e) => update('full_name', e.target.value)}
                className="input-field" placeholder="Seu nome completo" required />
            </div>
            <div>
              <label htmlFor="p-business" className="label-field">Nome do Negócio</label>
              <input id="p-business" value={form.business_name} onChange={(e) => update('business_name', e.target.value)}
                className="input-field" placeholder="Nome da empresa" />
            </div>
          </div>

          <div>
            <label htmlFor="p-bio" className="label-field">Descrição / Bio</label>
            <textarea id="p-bio" value={form.bio} onChange={(e) => update('bio', e.target.value)}
              rows={4} maxLength={500}
              placeholder="Descreva seus serviços, experiência e diferenciais..."
              className="input-field resize-none" />
            <p className="text-right text-xs text-gray-400 mt-1">{form.bio.length}/500</p>
          </div>
        </div>

        {/* ===== LOCALIZAÇÃO ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-black text-gray-800 text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" /> Localização
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-city" className="label-field">Cidade *</label>
              <input id="p-city" value={form.city} onChange={(e) => update('city', e.target.value)}
                className="input-field" placeholder="Sua cidade" required />
            </div>
            <div>
              <label htmlFor="p-state" className="label-field">Estado *</label>
              <div className="relative">
                <select id="p-state" value={form.state} onChange={(e) => update('state', e.target.value)}
                  className="input-field appearance-none pr-8" required>
                  <option value="">Selecione</option>
                  {ESTADOS_BR.map((e) => <option key={e.sigla} value={e.sigla}>{e.nome} ({e.sigla})</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ===== ÁREA DE ATUAÇÃO ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-black text-gray-800 text-lg">Área de Atuação</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-category" className="label-field">Categoria</label>
              <div className="relative">
                <select id="p-category" value={form.category_id} onChange={(e) => update('category_id', e.target.value)}
                  className="input-field appearance-none pr-8">
                  <option value="">Selecione</option>
                  {CATEGORIES_STATIC.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {subcategories.length > 0 && (
              <div>
                <label htmlFor="p-subcategory" className="label-field">Subcategoria</label>
                <div className="relative">
                  <select id="p-subcategory" value={form.subcategory_id} onChange={(e) => update('subcategory_id', e.target.value)}
                    className="input-field appearance-none pr-8">
                    <option value="">Selecione</option>
                    {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== CONTATO ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-black text-gray-800 text-lg">Informações de Contato</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-whatsapp" className="label-field flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-green-600" /> WhatsApp
              </label>
              <input id="p-whatsapp" type="tel" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)}
                className="input-field" placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label htmlFor="p-email-public" className="label-field flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> E-mail Público
              </label>
              <input id="p-email-public" type="email" value={form.email_public} onChange={(e) => update('email_public', e.target.value)}
                className="input-field" placeholder="contato@empresa.com" />
            </div>
            <div>
              <label htmlFor="p-website" className="label-field flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" /> Site
              </label>
              <input id="p-website" type="url" value={form.website_url} onChange={(e) => update('website_url', e.target.value)}
                className="input-field" placeholder="https://seusite.com.br" />
            </div>
            <div>
              <label htmlFor="p-instagram" className="label-field flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-pink-600" /> Instagram
              </label>
              <input id="p-instagram" value={form.instagram_url} onChange={(e) => update('instagram_url', e.target.value)}
                className="input-field" placeholder="@seuperfil" />
            </div>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Perfil salvo com sucesso!
          </div>
        )}

        {/* Botão salvar */}
        <button id="btn-save-profile" type="submit" disabled={saving}
          className="w-full py-4 rounded-2xl text-white font-black text-base transition-all hover:brightness-110 hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</> : <><Save className="w-5 h-5" /> Salvar Perfil</>}
        </button>
      </form>

      {/* Estilos inline para campos */}
      <style jsx>{`
        .label-field { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem; }
        .input-field { width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; font-size: 0.875rem; color: #1f2937; background: white; transition: all 0.2s; }
        .input-field:focus { outline: none; ring: 2px solid #009B3A; border-color: transparent; box-shadow: 0 0 0 2px #009B3A; }
      `}</style>
    </div>
  )
}
