'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import {
  Camera, Save, Loader2, AlertCircle, CheckCircle2,
  Globe, AtSign, Phone, Mail, MapPin, ChevronDown, Clock3
} from 'lucide-react'
import ProfileGallery from '@/components/profile/ProfileGallery'
import ProfileSegmentsEditor from '@/components/profiles/ProfileSegmentsEditor'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/supabase/db'
import { ESTADOS_BR } from '@/lib/constants/categories'
import { getInitials } from '@/lib/utils/helpers'
import { useCategoryCatalog } from '@/lib/categories/use-category-catalog'
import { getSubcategoryCategoryLookup } from '@/lib/categories/catalog'
import { validateProfileSegments, type ProfileSegmentSelection } from '@/lib/profiles/coverage'
import { normalizeStoredPlanType, type PlanType } from '@/lib/plans/entitlements'
import {
  createEmptyServiceHours,
  hydrateServiceHours,
  serializeServiceHours,
  SERVICE_HOUR_DAYS,
  validateServiceHours,
  type ServiceHoursForm,
} from '@/lib/profiles/service-hours'
import type { Json, Profile } from '@/types/database'

type SavedServiceArea = {
  ibge_code: string | null
  municipality_name: string | null
  state_code: string | null
  is_national: boolean
  declared_non_presential: boolean
  selection_order: number
}

function SignupSetupNotice() {
  const searchParams = useSearchParams()
  if (searchParams.get('cadastro') !== 'pendente') return null

  return (
    <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Sua conta foi confirmada, mas não foi possível concluir os dados iniciais. Revise seus segmentos e salve o perfil.
    </div>
  )
}

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '', business_name: '', bio: '', city: '',
    state: '', website_url: '', instagram_url: '',
    email_public: '', whatsapp: '',
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [loadAttempt, setLoadAttempt] = useState(0)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [profileSegments, setProfileSegments] = useState<ProfileSegmentSelection>({ segments: [] })
  const [serviceAreas, setServiceAreas] = useState<SavedServiceArea[]>([])
  const [profilePlan, setProfilePlan] = useState<PlanType>('Gratuito')
  const [serviceHours, setServiceHours] = useState<ServiceHoursForm>(createEmptyServiceHours())
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategoryCatalog()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) { router.replace('/login'); return }

        const fetchSegments = async () => {
          const res = await db.from('profile_categories')
            .select('id, category_id, selection_order, service_audiences')
            .eq('profile_id', user.id)
            .order('selection_order')
          if (res.error && (res.error.code === '42703' || res.error.message?.includes('service_audiences'))) {
            return db.from('profile_categories')
              .select('id, category_id, selection_order')
              .eq('profile_id', user.id)
              .order('selection_order')
          }
          return res
        }

        const [profileResult, segmentResult, subcategoryResult, serviceAreaResult, planResult] = await Promise.all([
          db.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          fetchSegments(),
          db.from('profile_subcategories')
            .select('profile_category_id, subcategory_id, selection_order')
            .order('selection_order'),
          db.from('profile_service_areas')
            .select('ibge_code, municipality_name, state_code, is_national, declared_non_presential, selection_order')
            .eq('profile_id', user.id)
            .order('selection_order'),
          // RPC disponível após migration — captura falha sem bloquear o carregamento
          db.rpc('get_effective_plan', { p_profile_id: user.id }).catch(() => ({ data: null, error: null })),
        ])

        if (profileResult.error) throw profileResult.error
        if (segmentResult.error) throw segmentResult.error
        if (subcategoryResult.error) throw subcategoryResult.error
        if (serviceAreaResult.error) throw serviceAreaResult.error

        let profileData: Profile = profileResult.data
        if (!profileData) {
          const initialProfile = {
            id: user.id,
            full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Usuário',
            email: user.email || null,
            city: (user.user_metadata?.city as string) || '',
            state: (user.user_metadata?.state as string) || '',
            plan_type: 'Gratuito',
            is_active: false,
            accepted_terms: true,
          }
          const { data: created, error: createError } = await db.from('profiles').insert(initialProfile).select().single()
          if (!createError && created) {
            profileData = created as Profile
          } else {
            throw new Error('PROFILE_NOT_FOUND')
          }
        }
        const savedSubcategories = subcategoryResult.data ?? []
        const savedSegments = (segmentResult.data ?? []).map((segment: {
          id: string
          category_id: string
          selection_order: number
          service_audiences: string[] | null
        }, index: number) => {
          const serviceAudiences = (segment.service_audiences ?? [])
            .filter((audience): audience is 'commercial' | 'residential' =>
              audience === 'commercial' || audience === 'residential',
            )
          return {
            categoryId: segment.category_id,
            subcategoryIds: savedSubcategories
              .filter((subcategory: { profile_category_id: string }) => subcategory.profile_category_id === segment.id)
              .map((subcategory: { subcategory_id: string }) => subcategory.subcategory_id),
            isPrimary: index === 0,
            serviceAudiences: serviceAudiences.length > 0 ? serviceAudiences : ['commercial', 'residential'],
          }
        })
        if (savedSegments.length === 0 && profileData.category_id) {
          savedSegments.push({
            categoryId: profileData.category_id,
            subcategoryIds: profileData.subcategory_id ? [profileData.subcategory_id] : [],
            isPrimary: true,
            serviceAudiences: ['commercial', 'residential'],
          })
        }
        const storedPlan = typeof planResult.data === 'string' ? planResult.data : profileData.plan_type

        if (cancelled) return
        setProfile(profileData)
        setProfileSegments({ segments: savedSegments })
        setServiceAreas((serviceAreaResult.data ?? []) as SavedServiceArea[])
        setProfilePlan(normalizeStoredPlanType(storedPlan))
        setServiceHours(hydrateServiceHours(profileData.service_hours))
        setForm({
          full_name: profileData.full_name || '',
          business_name: profileData.business_name || '',
          bio: profileData.bio || '',
          city: profileData.city || '',
          state: profileData.state || '',
          website_url: profileData.website_url || '',
          instagram_url: profileData.instagram_url || '',
          email_public: profileData.email_public || '',
          whatsapp: profileData.whatsapp || '',
        })
      } catch (loadError) {
        console.error('Falha ao carregar perfil:', loadError)
        if (!cancelled) setError('Não foi possível carregar seu perfil. Tente novamente.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [router, loadAttempt])

  const handleAvatarSelect = (file: File) => {
    const url = URL.createObjectURL(file)
    setAvatarFile(file)
    setAvatarPreview(url)
  }

  const uploadImage = async (file: File, bucket: string, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw new Error('PROFILE_IMAGE_UPLOAD_FAILED')
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const hoursError = validateServiceHours(serviceHours)
    if (hoursError) { setError(hoursError); return }
    if (categoriesLoading) { setError('Aguarde o carregamento das categorias.'); return }
    if (categoriesError) { setError(categoriesError); return }
    if (profileSegments.segments.length === 0) {
      setError('Selecione ao menos um segmento para o seu perfil.')
      return
    }
    const availableCategoryIds = new Set(categories.map((category) => category.id))
    if (profileSegments.segments.some((segment) => !availableCategoryIds.has(segment.categoryId))) {
      setError('Revise os segmentos do perfil e selecione categorias disponíveis.')
      return
    }
    const segmentValidation = validateProfileSegments(
      profilePlan,
      profileSegments,
      getSubcategoryCategoryLookup(categories),
    )
    if (!segmentValidation.valid) { setError(segmentValidation.errors.join(' ')); return }

    setSaving(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) { setError('Sua sessão expirou.'); return }

      let avatar_url = profile?.avatar_url ?? null
      try {
        if (avatarFile) avatar_url = await uploadImage(avatarFile, 'avatars', user.id)
      } catch (uploadError) {
        if (uploadError instanceof Error && uploadError.message === 'PROFILE_IMAGE_UPLOAD_FAILED') {
          throw new Error('PROFILE_IMAGE_UPLOAD_FAILED')
        }
        throw uploadError
      }

      const orderedSegments = [...profileSegments.segments].sort(
        (first, second) => Number(second.isPrimary) - Number(first.isPrimary),
      )
      let { error: coverageError } = await db.rpc('save_profile_coverage_with_audiences', {
        p_service_areas: serviceAreas.map((area) => ({
          ibgeCode: area.ibge_code,
          name: area.municipality_name,
          stateCode: area.state_code,
          isNational: area.is_national,
          declaredNonPresential: area.declared_non_presential,
          selectionOrder: area.selection_order,
        })),
        p_segments: orderedSegments.map((segment, selectionOrder) => ({
          categoryId: segment.categoryId,
          serviceAudiences: segment.serviceAudiences,
          selectionOrder,
          subcategories: segment.subcategoryIds.map((subcategoryId, subcategoryOrder) => ({
            subcategoryId,
            selectionOrder: subcategoryOrder,
          })),
        })),
        p_declared_non_presential: serviceAreas.some((area) => area.is_national && area.declared_non_presential),
        p_service_hours: serializeServiceHours(serviceHours) as Json,
      })

      // Se a RPC da v6 ainda não existe no banco, executa fallback para a v4/v5 existente
      if (coverageError && (coverageError.code === '42883' || coverageError.code === 'PGRST202' || coverageError.message?.includes('save_profile_coverage_with_audiences'))) {
        const fallbackRes = await db.rpc('save_profile_coverage', {
          p_service_areas: serviceAreas.map((area) => ({
            ibgeCode: area.ibge_code,
            name: area.municipality_name,
            stateCode: area.state_code,
            isNational: area.is_national,
            declaredNonPresential: area.declared_non_presential,
            selectionOrder: area.selection_order,
          })),
          p_segments: orderedSegments.map((segment, selectionOrder) => ({
            categoryId: segment.categoryId,
            selectionOrder,
            subcategories: segment.subcategoryIds.map((subcategoryId, subcategoryOrder) => ({
              subcategoryId,
              selectionOrder: subcategoryOrder,
            })),
          })),
          p_declared_non_presential: serviceAreas.some((area) => area.is_national && area.declared_non_presential),
        })
        coverageError = fallbackRes.error
      }
      if (coverageError) throw coverageError

      const profileUpdates: Partial<Profile> = {
        full_name: form.full_name,
        business_name: form.business_name || null,
        is_active: true,
        bio: form.bio || null,
        city: form.city,
        state: form.state,
        website_url: form.website_url || null,
        instagram_url: form.instagram_url || null,
        email_public: form.email_public || null,
        whatsapp: form.whatsapp || null,
        avatar_url,
      }

      const { error: updateError } = await db.from('profiles').update(profileUpdates).eq('id', user.id)
      if (updateError) throw updateError

      setProfile((current) => current ? { ...current, ...profileUpdates } : current)
      if (new URLSearchParams(window.location.search).get('cadastro') === 'pendente') {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { pending_profile_setup: null },
        })
        if (metadataError) console.error('[PERFIL] Não foi possível limpar os dados temporários do cadastro', metadataError)
        router.replace('/perfil')
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (saveError) {
      console.error('Falha ao salvar:', saveError)
      setError(saveError instanceof Error && saveError.message === 'PROFILE_IMAGE_UPLOAD_FAILED'
        ? 'Não foi possível enviar a imagem. Tente novamente.'
        : 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          <p>{error || 'Não foi possível carregar seu perfil.'}</p>
          <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const update = (field: string, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Meu Perfil</h1>
      <p className="text-gray-500 mb-8">Personalize como você aparece na plataforma</p>
      <Suspense fallback={null}><SignupSetupNotice /></Suspense>

      <form id="profile-form" onSubmit={handleSave} className="space-y-6">

        {/* ===== LOGOMARCA ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-6 flex items-end justify-between">
            <div className="relative cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
              {(avatarPreview || profile?.avatar_url) ? (
                <Image src={avatarPreview || profile!.avatar_url!} alt="Avatar" width={88} height={88}
                  className="rounded-2xl border-4 border-white shadow-lg object-cover" />
              ) : (
                <div className="w-[88px] h-[88px] rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-black"
                  style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                  {getInitials(form.full_name || 'ON')}
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAvatarSelect(e.target.files[0])} />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Logomarca disponível em todos os planos</p>
              {(profile?.is_verified) && (
                <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Perfil Verificado
                </span>
              )}
            </div>
          </div>
        </div>

        <ProfileGallery />

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
          <h2 className="font-black text-gray-800 text-lg">Segmentos do Perfil</h2>
          <p className="text-sm text-gray-500">
            Defina as categorias, subcategorias e o tipo de cliente atendido em cada segmento.
          </p>
          <ProfileSegmentsEditor
            categories={categories}
            loading={categoriesLoading}
            catalogError={categoriesError}
            plan={profilePlan}
            value={profileSegments}
            onChange={setProfileSegments}
          />
        </div>

        {/* ===== HORÁRIO DE ATENDIMENTO ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-black text-gray-800 text-lg flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-green-600" /> Horário de Atendimento
          </h2>
          <p className="text-sm text-gray-500">
            Informe seus horários por dia. Esses dados aparecem somente no perfil público.
          </p>
          <div className="space-y-3">
            {SERVICE_HOUR_DAYS.map(({ key, label }) => {
              const day = serviceHours[key]
              return (
                <div key={key} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 p-3 sm:grid-cols-[minmax(130px,1fr)_1fr_1fr_auto] sm:items-center">
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <label className="text-xs text-gray-500">
                    Abertura
                    <input
                      type="time"
                      value={day.open}
                      disabled={day.closed}
                      onChange={(event) => setServiceHours((current) => ({
                        ...current,
                        [key]: { ...current[key], open: event.target.value },
                      }))}
                      className="input-field mt-1 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </label>
                  <label className="text-xs text-gray-500">
                    Fechamento
                    <input
                      type="time"
                      value={day.close}
                      disabled={day.closed}
                      onChange={(event) => setServiceHours((current) => ({
                        ...current,
                        [key]: { ...current[key], close: event.target.value },
                      }))}
                      className="input-field mt-1 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 sm:pt-4">
                    <input
                      type="checkbox"
                      checked={day.closed}
                      onChange={(event) => setServiceHours((current) => ({
                        ...current,
                        [key]: { ...current[key], closed: event.target.checked },
                      }))}
                      className="h-4 w-4 accent-green-700"
                    />
                    Fechado
                  </label>
                </div>
              )
            })}
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
