'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/supabase/db'
import MunicipalitySelect from '@/components/geography/MunicipalitySelect'
import { ESTADOS_BR } from '@/lib/constants/categories'
import ProfileSegmentsEditor from '@/components/profiles/ProfileSegmentsEditor'
import { getSubcategoryCategoryLookup } from '@/lib/categories/catalog'
import { useCategoryCatalog } from '@/lib/categories/use-category-catalog'
import { getAuthCallbackUrl } from '@/lib/auth/redirects'
import { setSignupHandoff } from '@/lib/auth/signup-handoff'
import type { Municipality } from '@/lib/geography/municipalities'
import { validateCoverageSelection, validateProfileSegments, type ProfileSegmentSelection } from '@/lib/profiles/coverage'
import type { PlanType } from '@/lib/plans/entitlements'

const STEPS = ['Dados Pessoais', 'Localização', 'Atuação', 'Senha']

export default function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    email: '',
    whatsapp: '',
    website_url: '',
    instagram_url: '',
    password: '',
    confirm_password: '',
  })
  const [municipality, setMunicipality] = useState<Municipality | null>(null)
  const [segments, setSegments] = useState<ProfileSegmentSelection>({ segments: [] })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false)
  const [resendingConfirmation, setResendingConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategoryCatalog()
  const registrationPlan: PlanType = 'Gratuito'

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const nextStep = () => {
    setError('')
    if (step === 0 && !form.full_name) { setError('Informe seu nome completo'); return }
    if (step === 0 && !form.email) { setError('Informe seu e-mail'); return }
    if (step === 1 && !municipality) { setError('Selecione um município oficial'); return }
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const handleGoogleRegister = async () => {
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(window.location.origin),
      },
    })
    if (googleError) {
      console.error('Erro no cadastro com Google:', googleError)
      setError('Erro ao iniciar cadastro com Google.')
    }
  }

  const handleResendConfirmation = async () => {
    const email = form.email.trim().toLowerCase()
    if (!email) {
      setError('Informe seu e-mail para receber um novo link de confirmação.')
      return
    }

    setError('')
    setConfirmationMessage('')
    setResendingConfirmation(true)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: getAuthCallbackUrl(window.location.origin) },
      })
      if (resendError) throw resendError
      setConfirmationMessage('O pedido de reenvio foi aceito. Confira a caixa de entrada e o spam.')
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'Não foi possível reenviar o link. Tente novamente.')
    } finally {
      setResendingConfirmation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (accountCreated) return

    if (form.password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres'); return }
    if (form.password !== form.confirm_password) { setError('As senhas não conferem'); return }
    if (!municipality) { setError('Selecione um município oficial'); setStep(1); return }
    if (!acceptedTerms) { setError('Aceite os Termos de Uso e a Política de Privacidade'); return }
    if (categoriesError) { setError(categoriesError); setStep(2); return }

    const coverageResult = validateCoverageSelection(registrationPlan, {
      scope: 'municipalities',
      municipalities: [municipality],
    })
    if (!coverageResult.valid) { setError(coverageResult.errors.join(' ')); setStep(1); return }
    if (segments.segments.length !== 1) {
      setError('Selecione uma categoria para sua área de atuação.')
      setStep(2)
      return
    }
    if (segments.segments.some((segment) => !categories.some((category) => category.id === segment.categoryId))) {
      setError('Selecione uma categoria válida do catálogo.')
      setStep(2)
      return
    }
    const segmentResult = validateProfileSegments(
      registrationPlan,
      segments,
      getSubcategoryCategoryLookup(categories),
    )
    if (!segmentResult.valid) { setError(segmentResult.errors.join(' ')); setStep(2); return }

    const orderedSegments = [...segments.segments].sort(
      (first, second) => Number(second.isPrimary) - Number(first.isPrimary),
    )
    const serviceAreas = [{
      ibgeCode: municipality.ibgeCode,
      name: municipality.name,
      stateCode: municipality.stateCode,
      isNational: false,
      declaredNonPresential: false,
      selectionOrder: 0,
    }]
    const selectedSegments = orderedSegments.map((segment, selectionOrder) => ({
      categoryId: segment.categoryId,
      serviceAudiences: segment.serviceAudiences,
      selectionOrder,
      subcategories: segment.subcategoryIds.map((subcategoryId, subcategoryOrder) => ({
        subcategoryId,
        selectionOrder: subcategoryOrder,
      })),
    }))

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(window.location.origin),
          data: {
            full_name: form.full_name,
            city: municipality.name,
            state: municipality.stateCode,
            accepted_terms: true,
            pending_profile_setup: {
              business_name: form.business_name || null,
              whatsapp: form.whatsapp || null,
              website_url: form.website_url || null,
              instagram_url: form.instagram_url || null,
              service_areas: serviceAreas,
              segments: selectedSegments,
              declared_non_presential: false,
            },
          },
        },
      })

      if (signUpError || !data.user) {
        setError(signUpError?.message || 'Erro ao criar conta. Tente novamente.')
        return
      }

      if (!data.session) {
        setEmailConfirmationPending(true)
        setAccountCreated(true)
        return
      }

      const { error: profileError } = await db.from('profiles').update({
        business_name: form.business_name || null,
        city: municipality.name,
        state: municipality.stateCode,
        whatsapp: form.whatsapp || null,
        website_url: form.website_url || null,
        instagram_url: form.instagram_url || null,
      }).eq('id', data.user.id)

      if (profileError) {
        console.error('[CADASTRO] Falha ao salvar os dados do perfil', profileError)
        setError('A conta foi criada, mas não foi possível salvar os dados do perfil. Entre novamente e tente salvar em Meu Perfil.')
        setAccountCreated(true)
        return
      }

      let { error: coverageError } = await db.rpc('save_profile_coverage_with_audiences', {
        p_service_areas: serviceAreas,
        p_segments: selectedSegments,
        p_declared_non_presential: false,
        p_service_hours: null,
      })

      // Se a RPC da v6 ainda não existe no banco, executa fallback para a v4/v5 existente
      if (coverageError && (coverageError.code === '42883' || coverageError.code === 'PGRST202' || coverageError.message?.includes('save_profile_coverage_with_audiences'))) {
        const fallbackSegments = selectedSegments.map((segment: { categoryId: string; subcategories: unknown }) => ({
          categoryId: segment.categoryId,
          subcategories: segment.subcategories,
        }))
        const fallbackRes = await db.rpc('save_profile_coverage', {
          p_service_areas: serviceAreas,
          p_segments: fallbackSegments,
          p_declared_non_presential: false,
        })
        coverageError = fallbackRes.error
      }

      if (coverageError) {
        console.error('[CADASTRO] Falha ao salvar cobertura e segmentos', coverageError)
        setError(`A conta foi criada, mas não foi possível salvar sua área de atuação: ${coverageError.message}`)
        setAccountCreated(true)
        return
      }

      const { error: activationError } = await db.from('profiles')
        .update({ is_active: true })
        .eq('id', data.user.id)
      if (activationError) {
        console.error('[CADASTRO] Falha ao publicar o perfil após concluir o cadastro', activationError)
        setError('A conta foi criada, mas o perfil não pôde ser publicado. Entre em Meu Perfil e tente salvar novamente.')
        setAccountCreated(true)
        return
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { pending_profile_setup: null },
      })
      if (metadataError) console.error('[CADASTRO] Não foi possível limpar os dados temporários do cadastro', metadataError)

      router.push('/?cadastro=sucesso')
      router.refresh()
    } catch (submitError) {
      console.error('[CADASTRO] Falha inesperada ao criar a conta', submitError)
      setError(
        submitError instanceof Error
          ? `Não foi possível concluir o cadastro: ${submitError.message}`
          : 'Não foi possível concluir o cadastro. Tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <Image
          src="/images/LogoTransp..png"
          alt="Desconto do Dono"
          width={1024}
          height={572}
          className="h-12 w-auto mx-auto mb-4 object-contain"
        />
        <h1 className="text-2xl font-black text-gray-900">Criar conta grátis</h1>
        <p className="text-gray-500 text-sm mt-1">Crie seu perfil e comece a fazer conexões</p>
      </div>

      {/* Google Register — apenas no step 0 */}
      {step === 0 && !accountCreated && (
        <>
          <button
            type="button"
            onClick={() => void handleGoogleRegister()}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-all hover:shadow-md mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Cadastrar com Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">ou com e-mail</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-1.5 rounded-full transition-all duration-300 ${
              i <= step ? 'bg-green-500' : 'bg-gray-200'
            }`} />
            <span className={`text-xs font-medium hidden sm:block ${
              i === step ? 'text-green-700' : i < step ? 'text-green-500' : 'text-gray-400'
            }`}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {accountCreated && (
        <div role="status" className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {emailConfirmationPending ? (
            <div className="space-y-3">
              <p>
                Conta criada para {form.email}. Ainda falta confirmar o e-mail; o link pode demorar ou não chegar.
                Confira também a caixa de spam.
              </p>
              {confirmationMessage && <p className="text-green-800">{confirmationMessage}</p>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={() => void handleResendConfirmation()}
                  disabled={resendingConfirmation}
                  className="font-semibold underline disabled:opacity-60"
                >
                  {resendingConfirmation ? 'Reenviando…' : 'Reenviar link de confirmação'}
                </button>
                <Link
                  href="/login"
                  onClick={() => setSignupHandoff({ email: form.email, password: form.password })}
                  className="font-semibold underline"
                >
                  Entrar na conta
                </Link>
              </div>
            </div>
          ) : (
            <>Conta criada. Acesse sua conta para concluir o cadastro no perfil. <Link href="/perfil" className="font-semibold underline">Abrir perfil</Link> ou <Link href="/login" className="font-semibold underline">entrar</Link>.</>
          )}
        </div>
      )}

      <form
        id="register-form"
        onSubmit={handleSubmit}
        className={accountCreated ? 'pointer-events-none opacity-50' : ''}
      >
        {/* STEP 0: Dados Pessoais */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="reg-fullname" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nome Completo *
              </label>
              <input id="reg-fullname" type="text" value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            <div>
              <label htmlFor="reg-business" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nome do Negócio (opcional)
              </label>
              <input id="reg-business" type="text" value={form.business_name}
                onChange={(e) => update('business_name', e.target.value)}
                placeholder="Nome da sua empresa"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                E-mail *
              </label>
              <input id="reg-email" type="email" value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="seu@email.com" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            <div>
              <label htmlFor="reg-whatsapp" className="block text-sm font-semibold text-gray-700 mb-1.5">
                WhatsApp (opcional)
              </label>
              <input id="reg-whatsapp" type="tel" value={form.whatsapp}
                onChange={(e) => update('whatsapp', e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
          </div>
        )}

        {/* STEP 1: Localização */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-state" className="block text-sm font-semibold text-gray-700 mb-1.5">Estado *</label>
                <select id="reg-state" value={municipality?.stateCode || ''}
                  onChange={(e) => {
                    const newState = e.target.value;
                    // Update state code in municipality, clear city name/ibgeCode when state changes
                    setMunicipality(prev =>
                      prev ? { ...prev, stateCode: newState, name: '', ibgeCode: '' } : { stateCode: newState, name: '', ibgeCode: '' }
                    )
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
                  <option value="">Selecione</option>
                  {ESTADOS_BR.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>)}
                </select>
              </div>
              <div>
                <MunicipalitySelect
                  id="reg-city"
                  label="Cidade *"
                  value={municipality}
                  onChange={setMunicipality}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="reg-website" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Site (opcional)
              </label>
              <input id="reg-website" type="url" value={form.website_url}
                onChange={(e) => update('website_url', e.target.value)}
                placeholder="https://seusite.com.br"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            <div>
              <label htmlFor="reg-instagram" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Instagram (opcional)
              </label>
              <input id="reg-instagram" type="text" value={form.instagram_url}
                onChange={(e) => update('instagram_url', e.target.value)}
                placeholder="@seuperfil"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
          </div>
        )}

        {/* STEP 2: Área de Atuação */}
        {step === 2 && (
          <div className="space-y-4">
            <ProfileSegmentsEditor
              categories={categories}
              loading={categoriesLoading}
              catalogError={categoriesError}
              plan={registrationPlan}
              value={segments}
              onChange={setSegments}
            />
          </div>
        )}

        {/* STEP 3: Senha */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Senha *
              </label>
              <div className="relative">
                <input id="reg-password" type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres" required
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirmar Senha *
              </label>
              <input id="reg-confirm" type="password" value={form.confirm_password}
                onChange={(e) => update('confirm_password', e.target.value)}
                placeholder="Repita a senha" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            <label className="flex items-start gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                required
              />
              <span>
                Ao criar conta, você concorda com nossos{' '}
                <Link href="/termos" className="text-green-700 hover:underline">Termos de Uso</Link>{' '}
                e{' '}
                <Link href="/privacidade" className="text-green-700 hover:underline">Política de Privacidade</Link>.
              </span>
            </label>
          </div>
        )}

        {/* Botões de navegação */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
              Voltar
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button type="button" id="btn-next-step" onClick={nextStep}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
              Próximo
            </button>
          ) : (
            <button type="submit" id="btn-register-submit" disabled={loading || accountCreated}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : 'Criar conta'}
            </button>
          )}
        </div>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Já tem conta?{' '}
        <Link href="/login" className="text-green-700 font-bold hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
