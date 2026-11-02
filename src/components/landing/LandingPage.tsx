'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp, Users, MapPin, TrendingUp,
  ShieldCheck, Award, BadgeCheck, CheckCircle2, Loader2,
  ArrowRight, Building2, Star, Lock, Zap, HelpCircle
} from 'lucide-react'
import { BRAZILIAN_UF_CODES } from '@/lib/waitlist/validation'

// ============================================================
// DADOS ESTÁTICOS — Carta de Princípios
// ============================================================
const PRINCIPLES = [
  { icon: '🤝', title: 'Palavra Cumprida', desc: 'Comprometimento é inegociável. Quem fecha um acordo, cumpre.' },
  { icon: '⚙️', title: 'Trabalho e Mérito', desc: 'Valorizamos quem produz, entrega e cresce com esforço.' },
  { icon: '🚀', title: 'Livre Iniciativa', desc: 'Apoiamos o empreendedor que transforma ideias em negócios.' },
  { icon: '🔒', title: 'Privacidade Total', desc: 'Sem coleta de dados políticos. Seu negócio é o que importa.' },
  { icon: '🛡️', title: 'Comunidade Segura', desc: 'Ambiente de confiança mútua, sem espaço para fraudes.' },
  { icon: '🌱', title: 'Crescimento Coletivo', desc: 'O sucesso de um fortalece a rede de todos.' },
]

// FAQ com as respostas oficiais
const FAQ_ITEMS = [
  {
    q: 'É pago?',
    a: 'Não. Entrar na lista de espera e criar sua conta quando a plataforma abrir é gratuito.',
  },
  {
    q: 'Quando abre?',
    a: 'Vamos abrir por cidade, começando pelas que tiverem mais empreendedores inscritos. Quem está na lista recebe o convite por e-mail.',
  },
  {
    q: 'Preciso ter empresa?',
    a: 'Não. Autônomos, profissionais liberais e quem está começando também são bem-vindos.',
  },
  {
    q: 'O que vocês fazem com os meus dados?',
    a: 'Usamos só para avisar do lançamento e enviar o convite. Não vendemos nem repassamos seus dados a ninguém, e você pode sair e apagar tudo a qualquer momento.',
  },
  {
    q: 'Vocês perguntam minha posição política?',
    a: 'Não, e nunca vamos perguntar. A identidade da comunidade está na Carta de Princípios: quem se identifica com ela, entra.',
  },
  {
    q: 'Tenho uma empresa e quero oferecer benefícios.',
    a: 'Ótimo! Entre na lista marcando que tem empresa. Os benefícios serão cadastrados depois da abertura, com aprovação da equipe.',
  },
]

// Categorias para o formulário
const CATEGORIES_FORM = [
  { id: '11111111-0001-0001-0001-000000000001', name: 'Beleza' },
  { id: '11111111-0002-0002-0002-000000000002', name: 'Comércios' },
  { id: '11111111-0003-0003-0003-000000000003', name: 'Desenvolvedores' },
  { id: '11111111-0004-0004-0004-000000000004', name: 'Diversos' },
  { id: '11111111-0005-0005-0005-000000000005', name: 'Ensino' },
  { id: '11111111-0006-0006-0006-000000000006', name: 'Financeiras' },
  { id: '11111111-0007-0007-0007-000000000007', name: 'Gastronomia' },
  { id: '11111111-0008-0008-0008-000000000008', name: 'Hotelaria' },
  { id: '11111111-0009-0009-0009-000000000009', name: 'Lazer' },
  { id: '11111111-0010-0010-0010-000000000010', name: 'Marketing' },
  { id: '11111111-0011-0011-0011-000000000011', name: 'Prestação de Serviços' },
  { id: '11111111-0012-0012-0012-000000000012', name: 'Saúde' },
  { id: '11111111-0013-0013-0013-000000000013', name: 'Serviços para seu Pet' },
  { id: '11111111-0014-0014-0014-000000000014', name: 'Veículos' },
]

// Rankings mock (serão substituídos por dados reais)
const MOCK_RANKING = [
  { city: 'São Paulo', state: 'SP', total: 847, companies_count: 312 },
  { city: 'Belo Horizonte', state: 'MG', total: 634, companies_count: 218 },
  { city: 'Curitiba', state: 'PR', total: 521, companies_count: 189 },
  { city: 'Porto Alegre', state: 'RS', total: 489, companies_count: 167 },
  { city: 'Salvador', state: 'BA', total: 421, companies_count: 145 },
  { city: 'Fortaleza', state: 'CE', total: 387, companies_count: 134 },
  { city: 'Recife', state: 'PE', total: 356, companies_count: 121 },
  { city: 'Manaus', state: 'AM', total: 289, companies_count: 98 },
]

// ============================================================
// COMPONENTE WAITLIST FORM
// ============================================================
function WaitlistForm() {
  const [form, setForm] = useState({
    full_name: '', email: '', city: '', state: '',
    category_id: '', has_company: false, accepted_terms: false, website: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [position, setPosition] = useState<number | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [notice, setNotice] = useState('')

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.accepted_terms) { setError('Você precisa aceitar a Carta de Princípios para continuar.'); return }
    if (!form.full_name || !form.email || !form.city || !form.state) {
      setError('Preencha todos os campos obrigatórios.'); return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao cadastrar')
      if (json.success !== true) throw new Error('Não foi possível confirmar o cadastro.')
      setPosition(typeof json.position === 'number' ? json.position : null)
      setEmailSent(json.emailSent === true)
      setNotice(typeof json.notice === 'string' ? json.notice : '')
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar. Tente novamente.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Você está na lista! 🎉</h3>
        {position !== null && (
          <div className="inline-block px-6 py-2 rounded-full mb-4 text-white font-black text-lg"
            style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)', color: '#1a1a1a' }}>
            #{position}º na fila da sua cidade
          </div>
        )}
        <p role="status" aria-live="polite" className="text-gray-600 mb-2 max-w-sm mx-auto">
          {emailSent
            ? 'Enviamos um e-mail para confirmar o recebimento do seu cadastro.'
            : 'Seu cadastro foi recebido, mas não foi possível enviar o e-mail de confirmação agora.'}
        </p>
        {notice && <p className="text-sm text-amber-700 mb-4">{notice}</p>}
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          Quando sua cidade atingir o número mínimo de empreendedores, você receberá o convite por e-mail.
        </p>
        <p className="text-sm text-gray-500 font-medium">
          📤 Compartilhe com outros empreendedores para acelerar a abertura!
        </p>
      </div>
    )
  }

  return (
    <form id="waitlist-form" onSubmit={handleSubmit} className="space-y-4 p-6">
      <input id="wl-website" name="website" type="text" value={form.website}
        onChange={e => set('website', e.target.value)}
        aria-hidden="true" tabIndex={-1} autoComplete="off"
        className="sr-only" />
      <h3 className="text-xl font-black text-gray-900 mb-1">Entrar na Lista de Espera</h3>
      <p className="text-gray-500 text-sm mb-4">Cadastro 100% gratuito • Sem spam • Dados protegidos por LGPD</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <input id="wl-name" required value={form.full_name}
            onChange={e => set('full_name', e.target.value)}
            placeholder="Seu nome completo *"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
        </div>
        <div className="sm:col-span-2">
          <input id="wl-email" type="email" required value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="Seu melhor e-mail *"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
        </div>
        <div>
          <input id="wl-city" required value={form.city}
            onChange={e => set('city', e.target.value)}
            placeholder="Cidade *"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
        </div>
        <div className="relative">
          <select id="wl-state" required value={form.state}
            onChange={e => set('state', e.target.value)}
            className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">Estado *</option>
            {BRAZILIAN_UF_CODES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="sm:col-span-2 relative">
          <select id="wl-category" value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
            className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">Segmento (opcional)</option>
            {CATEGORIES_FORM.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Tem empresa? */}
      <label htmlFor="wl-company" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
        <input id="wl-company" type="checkbox" checked={form.has_company}
          onChange={e => set('has_company', e.target.checked)}
          className="w-5 h-5 rounded accent-green-600" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Tenho uma empresa</p>
          <p className="text-xs text-gray-400">Profissionais autônomos também são bem-vindos</p>
        </div>
        <Building2 className="w-5 h-5 text-gray-300 ml-auto" />
      </label>

      {/* Carta de Princípios */}
      <label htmlFor="wl-terms" className="flex items-start gap-3 p-3 rounded-xl border-2 border-green-200 bg-green-50 cursor-pointer">
        <input id="wl-terms" type="checkbox" required checked={form.accepted_terms}
          onChange={e => set('accepted_terms', e.target.checked)}
          className="w-5 h-5 rounded accent-green-600 mt-0.5 shrink-0" />
        <p className="text-sm text-gray-700 leading-relaxed">
          Li e concordo com a{' '}
          <a href="#principios" className="font-bold text-green-700 underline">Carta de Princípios</a>{' '}
          da comunidade <strong>Desconto do Dono</strong> e com a{' '}
          <Link href="/privacidade" className="font-bold text-green-700 underline">Política de Privacidade</Link>{' '}
          (LGPD). Entendo que não há coleta de dados políticos. *
        </p>
      </label>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <ShieldCheck className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <button id="btn-waitlist-submit" type="submit" disabled={loading}
        className="w-full py-4 rounded-2xl text-green-950 font-black text-base transition-all hover:brightness-110 hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}>
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Cadastrando...</>
          : <><Zap className="w-5 h-5" /> Quero minha vaga gratuita!</>
        }
      </button>
      <p className="text-xs text-center text-gray-400">🔒 Seus dados são protegidos por LGPD. Zero spam.</p>
    </form>
  )
}

// ============================================================
// COMPONENTE RANKING
// ============================================================
function CityRanking() {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? MOCK_RANKING : MOCK_RANKING.slice(0, 5)

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="font-black text-gray-900">Cidades na Frente</h3>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
          🔄 Tempo real
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {visible.map((city, i) => (
          <div key={`${city.city}-${city.state}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
              i === 0 ? 'text-yellow-700 bg-yellow-100' :
              i === 1 ? 'text-gray-600 bg-gray-100' :
              i === 2 ? 'text-orange-600 bg-orange-100' :
              'text-gray-500 bg-gray-50'
            }`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="font-semibold text-gray-900 text-sm truncate">{city.city}, {city.state}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {city.companies_count} empresas · {city.total} empreendedores
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black text-gray-900">{city.total.toLocaleString('pt-BR')}</p>
              <div className="w-20 h-1.5 rounded-full bg-gray-100 mt-1">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round((city.total / MOCK_RANKING[0].total) * 100)}%`,
                    background: 'linear-gradient(90deg, #009B3A, #FEDF00)',
                  }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setExpanded(!expanded)}
        className="w-full py-3 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center gap-1.5 border-t border-gray-50">
        {expanded
          ? <><ChevronUp className="w-4 h-4" /> Ver menos</>
          : <><ChevronDown className="w-4 h-4" /> Ver todas as cidades</>
        }
      </button>
    </div>
  )
}

// ============================================================
// PÁGINA PRINCIPAL (LANDING PAGE)
// ============================================================
export default function LandingPage() {
  return (
    <main className="min-h-screen">

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 bg-slate-900">
        {/* Overlay com brilho radial verde escuro (#005C2D) centralizado para tom executivo e premium */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 35%, rgba(0, 92, 45, 0.45) 0%, rgba(15, 23, 42, 0.85) 65%, #0f172a 100%)',
          }}
        />

        {/* Efeito sutil de textura/partículas */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(254, 223, 0, 0.2) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Texto do hero */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-sm font-semibold mb-6 shadow-sm">
                <Zap className="w-4 h-4 text-yellow-400" />
                🇧🇷 A comunidade dos empresários que movem o Brasil
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                Descontos de{' '}
                <span style={{ color: '#FEDF00' }}>Verdade</span>{' '}
                para Quem Move o País
              </h1>

              <p className="text-gray-200 text-lg md:text-xl leading-relaxed mb-8 font-normal">
                A ponte que conecta os melhores empreendedores do Brasil. O lugar certo para gerar conexões, contatos e contratos altamente confiáveis com quem move o nosso país.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { Icon: ShieldCheck, text: 'Empresas verificadas' },
                  { Icon: Lock, text: 'Privacidade & LGPD' },
                  { Icon: Award, text: 'Clube de descontos exclusivo' },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                    <Icon className="w-4 h-4 text-yellow-400" /> {text}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#lista-espera"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-slate-950 text-base hover:brightness-110 hover:shadow-2xl transition-all shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
                >
                  Quero minha vaga grátis <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#principios"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base border-2 border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-yellow-400/60 transition-all backdrop-blur-sm"
                >
                  Ver Carta de Princípios
                </a>
              </div>
            </div>

            {/* Elementos Visuais e Stats — Networking de Alto Nível */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative rounded-3xl overflow-hidden border border-yellow-400/30 shadow-2xl bg-slate-800/80 backdrop-blur-md group">
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src="/images/brasil000.jpg"
                    alt="Empreendedorismo e Networking no Brasil"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-slate-950/80 border border-yellow-400/50 backdrop-blur-sm text-yellow-400 text-xs font-bold flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-yellow-400" />
                    Rede Empresarial Verificada
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-black text-lg leading-tight">Aliança de Empreendedores</h3>
                      <p className="text-gray-400 text-xs mt-0.5">Conexões diretas, éticas e de alto valor</p>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden">
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-yellow-400/50 overflow-hidden bg-slate-700">
                        <img src="/images/networking-1.jpg" alt="Membro" className="h-full w-full object-cover" />
                      </div>
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-yellow-400/50 overflow-hidden bg-slate-700">
                        <img src="/images/networking-2.jpg" alt="Membro" className="h-full w-full object-cover" />
                      </div>
                      <div className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-yellow-400/50 bg-green-700 text-yellow-400 text-xs font-black">
                        +2k
                      </div>
                    </div>
                  </div>

                  {/* Grid de estatísticas rápidas */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/60">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/50">
                      <p className="text-xl font-black text-yellow-400">14</p>
                      <p className="text-gray-400 text-xs">Segmentos Estratégicos</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/50">
                      <p className="text-xl font-black text-yellow-400">2.800+</p>
                      <p className="text-gray-400 text-xs">Empresas na Lista</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/50">
                      <p className="text-xl font-black text-white">100%</p>
                      <p className="text-gray-400 text-xs">Privacidade Garantida</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/50">
                      <p className="text-xl font-black text-green-400">0%</p>
                      <p className="text-gray-400 text-xs">Taxa de Cadastro</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa Brasil */}
      <div className="h-2" style={{ background: 'linear-gradient(90deg, #009B3A 33%, #FEDF00 33%, #FEDF00 66%, #002776 66%)' }} />

      {/* ===== COMO FUNCIONA ===== */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Como Funciona</h2>
          <p className="text-gray-500 text-lg">Três passos para fazer parte da comunidade</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01', icon: '📝', title: 'Cadastre-se na lista',
              desc: 'Insira seu nome, cidade e segmento. Concorde com nossa Carta de Princípios.',
            },
            {
              step: '02', icon: '🏙️', title: 'Sua cidade chega ao mínimo',
              desc: 'Quando houver empreendedores suficientes na sua cidade, ela é "aberta".',
            },
            {
              step: '03', icon: '🎁', title: 'Resgate descontos',
              desc: 'Diretório de empresas, clube de descontos exclusivos e contatos verificados.',
            },
          ].map((step) => (
            <div key={step.step} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <span className="absolute top-4 right-4 text-6xl font-black text-gray-50">{step.step}</span>
              <span className="text-4xl mb-4 block">{step.icon}</span>
              <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FORMULÁRIO + RANKING ===== */}
      <section id="lista-espera" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Reserve sua Vaga</h2>
            <p className="text-gray-500 text-lg">Gratuito • Sem compromisso • Cancele quando quiser</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Formulário */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <WaitlistForm />
            </div>

            {/* Ranking */}
            <div className="space-y-4">
              <CityRanking />
              {/* Mini card de benefícios */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h4 className="font-black text-gray-900">O que você ganha</h4>
                </div>
                <ul className="space-y-2">
                  {[
                    'Diretório de empresas da sua cidade',
                    'Clube de descontos exclusivos',
                    'Chat privado para negociações',
                    'Perfil com selo de verificado',
                    'Acesso a 14 segmentos de negócio',
                  ].map(b => (
                    <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CARTA DE PRINCÍPIOS ===== */}
      <section id="principios" className="py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #f8fffe 0%, #f0f9f4 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-green-700 bg-green-100 text-sm font-semibold mb-4">
              <ShieldCheck className="w-4 h-4" /> Carta de Princípios
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3">
              Nossa Base é a Confiança
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Desconto do Dono é uma comunidade fundada em valores claros. Quem entra, aceita e pratica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-3xl mb-3 block">{p.icon}</span>
                <h3 className="font-black text-gray-900 mb-2">{p.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-green-50 border border-green-200 text-center">
            <ShieldCheck className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-black text-gray-900 mb-2">Compromisso com sua Privacidade</h3>
            <p className="text-gray-600 text-sm max-w-2xl mx-auto leading-relaxed">
              Coletamos apenas o necessário para o funcionamento da plataforma. <strong>Nunca coletamos dados políticos,
              religiosos ou partidários.</strong> Você é livre para sair a qualquer momento e solicitar a exclusão total
              dos seus dados, conforme a LGPD (Lei 13.709/2018).
            </p>
          </div>
        </div>
      </section>

      {/* ===== PREVIEW DO CLUBE DE BENEFÍCIOS ===== */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-yellow-700 bg-yellow-100 text-sm font-semibold mb-4">
              <Star className="w-4 h-4" /> Clube de Benefícios
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3">Membros que Oferecem Mais</h2>
            <p className="text-gray-500 text-lg">Descontos exclusivos entre empreendedores verificados</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Desconto em Software CRM', pct: 30, category: 'Desenvolvedores', author: 'TechPro BR' },
              { title: 'Consultoria Financeira Grátis', pct: 100, category: 'Financeiras', author: 'FinancePro MG' },
              { title: '15% em Publicidade Digital', pct: 15, category: 'Marketing', author: 'AdsMax SP' },
            ].map((b) => (
              <div key={b.title} className="relative bg-gradient-to-br from-green-50 to-white rounded-2xl p-5 border border-green-100">
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-white text-xs font-black"
                  style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                  -{b.pct}%
                </div>
                <BadgeCheck className="w-6 h-6 text-green-600 mb-2" />
                <h4 className="font-black text-gray-900 text-sm mb-1 pr-14">{b.title}</h4>
                <p className="text-xs text-gray-400 mb-3">{b.author} · {b.category}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Lock className="w-3 h-3" /> Exclusivo para membros
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a href="#lista-espera"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-green-950 transition-all hover:brightness-110 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}>
              Quero acessar os benefícios <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ===== FOOTER CTA ===== */}
      <section className="py-12 px-4"
        style={{ background: 'linear-gradient(135deg, #005C2D 0%, #009B3A 60%, #002776 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Sua cidade está esperando por você
          </h2>
          <p className="text-white/80 mb-8">
            Cada cadastro aproxima sua cidade da abertura. Compartilhe e acelere o processo!
          </p>
          <a href="#lista-espera"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-green-950 text-base transition-all hover:brightness-110 hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}>
            <Zap className="w-5 h-5" /> Reservar minha vaga grátis
          </a>
        </div>
      </section>
    </main>
  )
}

// ============================================================
// COMPONENTE FAQ (Accordion)
// ============================================================
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-blue-700 bg-blue-50 text-sm font-semibold mb-4">
            <HelpCircle className="w-4 h-4" /> Perguntas Frequentes
          </div>
          <h2 className="text-3xl font-black text-gray-900">Ficou com dúvidas?</h2>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
              <button
                id={`faq-toggle-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-gray-900 text-sm">{item.q}</span>
                {open === i
                  ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
