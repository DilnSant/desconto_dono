import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Star, Plus } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db as serverDb } from '@/lib/supabase/db'
import BeneficiosFeed from './BeneficiosFeed'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Clube de Descontos — Desconto do Dono',
  description: 'Descontos exclusivos oferecidos por empresas e empreendedores verificados do Desconto do Dono.',
}

const MOCK_BENEFITS = [
  {
    id: 'b1', title: '30% Off em Software CRM Completo',
    description: 'Acesso completo ao nosso CRM por 30% menos. Ideal para gestão de clientes e pipeline de vendas.',
    discount_pct: 30, discount_val: null, author: 'Carlos Mendes', business: 'TechPro BR',
    category: 'Desenvolvedores', valid_until: '2026-12-31', redemptions: 12,
    whatsapp: '11999999999', avatar_url: null, is_verified: true, video_embed_url: null,
    link_url: null,
  },
  {
    id: 'b2', title: 'Primeira Consultoria Financeira 100% Grátis',
    description: 'Uma hora de consultoria personalizada para reorganizar as finanças do seu negócio sem custo algum.',
    discount_pct: 100, discount_val: null, author: 'Ana Rodrigues', business: 'FinancePro MG',
    category: 'Financeiras', valid_until: '2026-11-30', redemptions: 28,
    whatsapp: '31888888888', avatar_url: null, is_verified: true, video_embed_url: null,
    link_url: null,
  },
  {
    id: 'b3', title: '15% em Toda Publicidade Digital',
    description: 'Google Ads, Meta Ads e TikTok Ads com 15% de desconto. Campanha mínima R$ 500.',
    discount_pct: 15, discount_val: null, author: 'Pedro Lima', business: 'AdsMax PR',
    category: 'Marketing', valid_until: '2026-12-15', redemptions: 7,
    whatsapp: '41777777777', avatar_url: null, is_verified: false, video_embed_url: null,
    link_url: null,
  },
  {
    id: 'b4', title: 'Design de Logo Profissional — R$ 200 Off',
    description: 'Identidade visual completa com desconto especial para membros. Logo + manual de marca.',
    discount_pct: null, discount_val: 200, author: 'Juliana Souza', business: 'DesignHouse SP',
    category: 'Marketing', valid_until: '2026-11-15', redemptions: 4,
    whatsapp: '11666666666', avatar_url: null, is_verified: true, video_embed_url: null,
    link_url: null,
  },
  {
    id: 'b5', title: '20% Off em Planos de Academia',
    description: 'Musculação, crossfit e hidroginástica. Válido para contratos semestrais.',
    discount_pct: 20, discount_val: null, author: 'Marcos Oliveira', business: 'FitZone Salvador',
    category: 'Lazer', valid_until: '2027-01-31', redemptions: 19,
    whatsapp: '71555555555', avatar_url: null, is_verified: true, video_embed_url: null,
    link_url: null,
  },
  {
    id: 'b6', title: 'Contabilidade MEI por R$ 59/mês',
    description: 'Abertura de empresa grátis + BPO financeiro por preço especial para membros da comunidade.',
    discount_pct: null, discount_val: 40, author: 'Fernanda Costa', business: 'ContaFácil BA',
    category: 'Financeiras', valid_until: '2026-12-31', redemptions: 34,
    whatsapp: '71444444444', avatar_url: null, is_verified: true, video_embed_url: null,
    link_url: null,
  },
]

export default async function BeneficiosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let benefits = MOCK_BENEFITS
  try {
    const { data } = await serverDb
      .from('benefits')
      .select('*, profiles:author_id(id,full_name,business_name,avatar_url,is_verified), categories:category_id(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (data && data.length > 0) benefits = data
  } catch { /* usa mock */ }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #002776, #006FC0)' }}>
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Clube de Descontos</h1>
              <p className="text-gray-500 text-sm">Descontos exclusivos de empresas verificadas</p>
            </div>
          </div>
        </div>
        <a href="/beneficios/novo" id="btn-new-benefit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 hover:shadow-md shrink-0"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
          <Plus className="w-4 h-4" /> Oferecer Desconto
        </a>
      </div>

      {/* Como funciona */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: '🔍', label: 'Encontre o desconto' },
          { icon: '🎁', label: 'Resgate com 1 clique' },
          { icon: '✅', label: 'Empresa entra em contato' },
        ].map((step) => (
          <div key={step.label} className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
            <span className="text-xl">{step.icon}</span> {step.label}
          </div>
        ))}
      </div>

      {/* Feed de Benefícios com Modal de Lead */}
      <BeneficiosFeed benefits={benefits} />

      {/* CTA oferecer */}
      <div className="mt-10 rounded-3xl p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #009B3A 0%, #005C2D 100%)' }}>
        <Star className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-white mb-2">Você também pode oferecer</h2>
        <p className="text-white/80 mb-6 max-w-sm mx-auto">
          Compartilhe um desconto com a comunidade e ganhe visibilidade para o seu negócio.
        </p>
        <a href="/beneficios/novo"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-green-950 transition-all hover:brightness-110 hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}>
          <Plus className="w-5 h-5" /> Oferecer Desconto Grátis
        </a>
      </div>
    </div>
  )
}
