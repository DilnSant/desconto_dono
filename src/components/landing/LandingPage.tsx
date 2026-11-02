'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp, Users, MapPin, ShieldCheck,
  ArrowRight, Zap, HelpCircle, MessageCircle
} from 'lucide-react'

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
    a: 'Criar uma conta e usar os recursos gratuitos não tem custo. Qualquer plano pago deve apresentar suas condições antes da contratação.',
  },
  {
    q: 'Posso usar a plataforma em qualquer cidade?',
    a: 'Sim. O cadastro é imediato para qualquer município; no plano gratuito, você escolhe uma cidade de atuação.',
  },
  {
    q: 'Preciso ter empresa?',
    a: 'Não. Autônomos, profissionais liberais e quem está começando também são bem-vindos.',
  },
  {
    q: 'O que vocês fazem com os meus dados?',
    a: 'Usamos seus dados para criar e administrar sua conta e oferecer os recursos da plataforma. Consulte nossa Política de Privacidade para conhecer os detalhes.',
  },
  {
    q: 'Vocês perguntam minha posição política?',
    a: 'Não, e nunca vamos perguntar. A identidade da comunidade está na Carta de Princípios: quem se identifica com ela, entra.',
  },
  {
    q: 'Tenho uma empresa e quero oferecer benefícios.',
    a: 'Crie sua conta gratuita e cadastre seu perfil. Você poderá publicar benefícios para a comunidade.',
  },
]

// ============================================================
// PÁGINA PRINCIPAL (LANDING PAGE)
// ============================================================
export default function LandingPage() {
  return (
    <main className="min-h-screen">

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 bg-slate-900">
        {/* Overlay com brilho radial verde escuro (#005C2D) centralizado */}
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
                  { Icon: Users, text: 'Conta gratuita' },
                  { Icon: MapPin, text: 'Conexões por cidade e segmento' },
                  { Icon: MessageCircle, text: 'Chat dentro da plataforma' },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                    <Icon className="w-4 h-4 text-yellow-400" /> {text}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-slate-950 text-base hover:brightness-110 hover:shadow-2xl transition-all shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
                >
                  Criar conta grátis <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#principios"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base border-2 border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-yellow-400/60 transition-all backdrop-blur-sm"
                >
                  Ver Carta de Princípios
                </a>
                <Link
                  href="/planos"
                  className="inline-flex items-center justify-center px-5 py-3 font-semibold text-white underline underline-offset-4 hover:text-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
                >
                  Comparar planos
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-yellow-400/30 bg-slate-800/80 p-6 md:p-8 shadow-2xl">
                <p className="text-yellow-300 font-bold mb-3">Sua cidade. Seu segmento. Sua rede.</p>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-6">
                  Seja um dos primeiros a criar conexões por aqui.
                </h2>
                <ul className="space-y-4 text-gray-200">
                  <li className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Monte seu perfil profissional sem custo.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Encontre negócios por cidade e área de atuação.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Comece uma conversa pelo chat da plataforma.</span>
                  </li>
                </ul>
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
              step: '01', icon: '📝', title: 'Crie seu perfil gratuito',
              desc: 'Informe sua cidade e área de atuação para apresentar seu negócio.',
            },
            {
              step: '02', icon: '🔎', title: 'Explore a rede',
              desc: 'Encontre empresas, profissionais e oportunidades na plataforma.',
            },
            {
              step: '03', icon: '💬', title: 'Inicie uma conversa',
              desc: 'Use o chat para começar a criar novas conexões profissionais.',
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

      {/* ===== COMEÇAR AGORA ===== */}
      <section id="comecar" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Sua próxima conexão pode começar hoje</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Crie sua conta gratuita, encontre empreendedores da sua região e comece uma conversa hoje.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-green-950 transition-all hover:brightness-110 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
            >
              Criar conta grátis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/categorias"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-green-800 border border-green-200 hover:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
              Explorar empresas
            </Link>
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

      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-3">
            Tem um negócio para apresentar?
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-7">
            Crie seu perfil, publique seus serviços e conheça profissionais que também estão construindo negócios.
          </p>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-green-950 transition-all hover:brightness-110 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
          >
            Começar gratuitamente <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <FAQSection />

      {/* ===== FOOTER CTA ===== */}
      <section className="py-12 px-4"
        style={{ background: 'linear-gradient(135deg, #005C2D 0%, #009B3A 60%, #002776 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Comece a criar conexões hoje
          </h2>
          <p className="text-white/80 mb-8">
            Crie uma conta gratuita e encontre empreendedores da sua cidade e área de atuação.
          </p>
          <Link href="/cadastro"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-green-950 text-base transition-all hover:brightness-110 hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}>
            <Zap className="w-5 h-5" /> Criar conta grátis
          </Link>
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
