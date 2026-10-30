'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle, ChevronDown, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/supabase/db'
import { CATEGORIES_STATIC, ESTADOS_BR } from '@/lib/constants/categories'
import type { CategoryWithSubs, Subcategory } from '@/types/database'

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
    city: '',
    state: '',
    whatsapp: '',
    website_url: '',
    instagram_url: '',
    category_id: '',
    subcategory_id: '',
    password: '',
    confirm_password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const selectedCategory = CATEGORIES_STATIC.find((c) => c.id === form.category_id)
  const subcategories: Subcategory[] = selectedCategory?.subcategories || []

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value, ...(field === 'category_id' ? { subcategory_id: '' } : {}) }))

  const nextStep = () => {
    setError('')
    if (step === 0 && !form.full_name) { setError('Informe seu nome completo'); return }
    if (step === 0 && !form.email) { setError('Informe seu e-mail'); return }
    if (step === 1 && !form.city) { setError('Informe sua cidade'); return }
    if (step === 1 && !form.state) { setError('Selecione seu estado'); return }
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres'); return }
    if (form.password !== form.confirm_password) { setError('As senhas não conferem'); return }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          city: form.city,
          state: form.state,
        },
      },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message || 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    // Atualizar perfil com dados adicionais
    await db.from('profiles').update({
      business_name: form.business_name || null,
      city: form.city,
      state: form.state,
      whatsapp: form.whatsapp || null,
      website_url: form.website_url || null,
      instagram_url: form.instagram_url || null,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
    }).eq('id', data.user.id)

    router.push('/?cadastro=sucesso')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <Image
          src="/images/logo.DDD2.jpeg"
          alt="Desconto do Dono"
          width={1024}
          height={572}
          className="h-12 w-auto mx-auto mb-4 object-contain"
        />
        <h1 className="text-2xl font-black text-gray-900">Criar conta grátis</h1>
        <p className="text-gray-500 text-sm mt-1">Junte-se a milhares de empreendedores</p>
      </div>

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

      <form id="register-form" onSubmit={handleSubmit}>
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
            <div>
              <label htmlFor="reg-city" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Cidade *
              </label>
              <input id="reg-city" type="text" value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Sua cidade"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            <div>
              <label htmlFor="reg-state" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Estado *
              </label>
              <div className="relative">
                <select id="reg-state" value={form.state}
                  onChange={(e) => update('state', e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white">
                  <option value="">Selecione o estado</option>
                  {ESTADOS_BR.map((est) => (
                    <option key={est.sigla} value={est.sigla}>{est.nome} ({est.sigla})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
            <div>
              <label htmlFor="reg-category" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Área de Atuação
              </label>
              <div className="relative">
                <select id="reg-category" value={form.category_id}
                  onChange={(e) => update('category_id', e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white">
                  <option value="">Selecione a categoria</option>
                  {CATEGORIES_STATIC.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {form.category_id && subcategories.length > 0 && (
              <div>
                <label htmlFor="reg-subcategory" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Subcategoria
                </label>
                <div className="relative">
                  <select id="reg-subcategory" value={form.subcategory_id}
                    onChange={(e) => update('subcategory_id', e.target.value)}
                    className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white">
                    <option value="">Selecione a subcategoria</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Preview da seleção */}
            {selectedCategory && (
              <div className="p-4 rounded-xl border border-green-100 bg-green-50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">{selectedCategory.name}</p>
                    {form.subcategory_id && (
                      <p className="text-xs text-green-600">
                        {subcategories.find((s) => s.id === form.subcategory_id)?.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
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
            <p className="text-xs text-gray-400">
              Ao criar conta, você concorda com nossos{' '}
              <Link href="/termos" className="text-green-700 hover:underline">Termos de Uso</Link>{' '}
              e{' '}
              <Link href="/privacidade" className="text-green-700 hover:underline">Política de Privacidade</Link>.
            </p>
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
            <button type="submit" id="btn-register-submit" disabled={loading}
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
