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
    q: 'É pago para cadastrar?',
    a: 'Não. O cadastro inicial é 100% gratuito, sem exigir cartão de crédito. Você cria seu perfil profissional, seleciona sua cidade de atuação e já pode publicar suas ofertas.',
  },
  {
    q: 'Vocês cobram comissão sobre as vendas ou pedidos?',
    a: 'Nunca. Cobrança de 15% a 27% por pedido fica para outros aplicativos. No Desconto do Dono, o cliente fala diretamente com você via WhatsApp, telefone ou balcão, e 100% do valor da venda é seu.',
  },
  {
    q: 'Como funciona o vídeo do dono?',
    a: 'Você ou sua equipe gravam um vídeo curto de até 30 segundos apresentando o negócio, os diferenciais e convidando o cliente. É a humanização que gera conexão imediata e confiança.',
  },
  {
    q: 'Posso usar a plataforma em qualquer cidade do Brasil?',
    a: 'Sim. Nosso catálogo é integrado com os 5.571 municípios oficiais do IBGE. Você pode atuar na sua cidade ou expandir sua área de cobertura.',
  },
  {
    q: 'Preciso ter CNPJ para participar?',
    a: 'Não é obrigatório. Autônomos, profissionais liberais, prestadores de serviços e comerciantes de qualquer porte são bem-vindos.',
  },
  {
    q: 'O que é o Selo de Empresa Verificada?',
    a: 'É uma chancela de segurança concedida às empresas após a validação cadastral pela nossa equipe, transmitindo autoridade máxima aos consumidores da plataforma.',
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
                🇧🇷 Vitrine direta com vídeo do dono em 5.571 municípios
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                Clientes Locais e Conexões Reais{' '}
                <span style={{ color: '#FEDF00' }}>Sem Pagar Comissão</span>
              </h1>

              <p className="text-gray-200 text-lg md:text-xl leading-relaxed mb-8 font-normal">
                Apresente seu negócio com vídeo do próprio dono, seja encontrado por cidade e segmento pelo IBGE e receba contatos diretos no seu WhatsApp — sem intermediários e sem taxas predatórias por venda.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { Icon: Users, text: 'Cadastro gratuito para começar' },
                  { Icon: MapPin, text: '5.571 municípios oficiais (IBGE)' },
                  { Icon: MessageCircle, text: 'Contato direto via WhatsApp e chat' },
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
                <p className="text-yellow-300 font-bold mb-3">Método Vitrine do Dono</p>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-6">
                  Por que donos de negócios escolhem o Desconto do Dono:
                </h2>
                <ul className="space-y-4 text-gray-200">
                  <li className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <span><strong>Vídeo do Dono:</strong> o cliente conhece quem está por trás antes de ir até você.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <span><strong>Busca Hiperlocal:</strong> catálogo municipal oficial do IBGE para a sua região.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <span><strong>100% da sua Venda:</strong> contato direto no seu WhatsApp ou balcão, zero comissões.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa Brasil */}
      <div className="h-2" style={{ background: 'linear-gradient(90deg, #009B3A 33%, #FEDF00 33%, #FEDF00 66%, #002776 66%)' }} />

      {/* ===== COMO FUNCIONA (MÉTODO VITRINE DO DONO) ===== */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-green-800 bg-green-100 text-sm font-semibold mb-3">
            Passo a passo comprovado
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">Como Funciona o Método Vitrine do Dono</h2>
          <p className="text-gray-500 text-lg">Do cadastro à primeira conexão com clientes da sua cidade</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01', icon: '📝', title: 'Crie seu perfil grátis',
              desc: 'Cadastre sua empresa, cidade de atuação e segmentos atendidos em minutos.',
            },
            {
              step: '02', icon: '🎬', title: 'Grave o vídeo do dono',
              desc: 'Um vídeo autêntico de 30 segundos contando quem você é e sua oferta real.',
            },
            {
              step: '03', icon: '📍', title: 'Apareça na sua cidade',
              desc: 'Indexação no catálogo municipal do IBGE para quem procura serviços locais.',
            },
            {
              step: '04', icon: '📲', title: 'Feche direto no WhatsApp',
              desc: 'Receba clientes sem intermediários, sem taxas e sem comissões sobre suas vendas.',
            },
          ].map((step) => (
            <div key={step.step} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="absolute top-4 right-4 text-5xl font-black text-gray-100">{step.step}</span>
                <span className="text-4xl mb-4 block">{step.icon}</span>
                <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== COMEÇAR AGORA ===== */}
      <section id="comecar" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Sua empresa visível para quem procura hoje</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Crie seu cadastro sem compromisso, publique seus anúncios com benefício real e conecte-se com clientes que valorizam o comércio local.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-green-950 transition-all hover:brightness-110 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
            >
              Criar conta grátis agora <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/categorias"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-green-800 border border-green-200 hover:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
              Explorar empresas cadastradas
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-yellow-800 bg-yellow-100 text-sm font-semibold mb-4">
            Zero Risco · Sem Cartão de Crédito
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">
            Pare de perder clientes para quem gasta fortunas em anúncio
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-7">
            No Desconto do Dono, a força da sua empresa é a sua verdade e reputação. Cadastre seu ponto comercial ou serviço autônomo e comece a ser descoberto na sua cidade.
          </p>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-green-950 transition-all hover:brightness-110 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
          >
            Começar Gratuitamente <ArrowRight className="w-5 h-5" />
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
