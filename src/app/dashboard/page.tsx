import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Plus, Star, ShieldCheck, TrendingUp, MessageCircle,
  MapPin, ArrowRight, Filter, Users, Award, BadgeCheck, Zap
} from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db as serverDb } from '@/lib/supabase/db'
import CategoryGrid from '@/components/categories/CategoryGrid'
import ListingCard from '@/components/listings/ListingCard'
import type { ListingWithProfile } from '@/types/database'
import SponsorBanner from '@/components/ui/SponsorBanner'




export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Desconto do Dono — Feed de Empresas e Descontos',
  description: 'Encontre empresas verificadas, resgate descontos exclusivos e conecte-se com empreendedores da sua cidade.',
}

// Mock listings para quando banco está vazio
const MOCK_LISTINGS: ListingWithProfile[] = [
  {
    id: 'mock-1', user_id: 'u1', title: 'Desenvolvimento de Sites e Lojas Virtuais',
    category_id: '11111111-0003-0003-0003-000000000003', subcategory_id: null,
    description: 'Sites modernos, responsivos e focados em conversão.',
    price: 1500, price_type: 'fixed', image_url: null, video_embed_url: null,
    location_city: 'São Paulo', location_state: 'SP', is_active: true, views: 234,
    created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: '',
    profiles: { id: 'u1', full_name: 'Carlos Mendes', business_name: 'WebPro Brasil', avatar_url: null, city: 'São Paulo', state: 'SP', is_verified: true, plan_type: 'Profissional' as const },
    categories: { name: 'Desenvolvedores', color: 'slate', slug: 'desenvolvedores' },
  },
  {
    id: 'mock-2', user_id: 'u2', title: 'Consultoria Financeira para PMEs',
    category_id: '11111111-0006-0006-0006-000000000006', subcategory_id: null,
    description: 'Organize as finanças da sua empresa e aumente lucros.',
    price: null, price_type: 'negotiable', image_url: null, video_embed_url: null,
    location_city: 'Belo Horizonte', location_state: 'MG', is_active: true, views: 187,
    created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: '',
    profiles: { id: 'u2', full_name: 'Ana Rodrigues', business_name: 'FinancePro MG', avatar_url: null, city: 'Belo Horizonte', state: 'MG', is_verified: true, plan_type: 'Essencial' as const },
    categories: { name: 'Financeiras', color: 'teal', slug: 'financeiras' },
  },
  {
    id: 'mock-3', user_id: 'u3', title: 'Marketing Digital e Design de Marcas',
    category_id: '11111111-0010-0010-0010-000000000010', subcategory_id: null,
    description: 'Campanhas que geram resultado. Google Ads, Meta e Branding.',
    price: 800, price_type: 'fixed', image_url: null, video_embed_url: null,
    location_city: 'Curitiba', location_state: 'PR', is_active: true, views: 312,
    created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: '',
    profiles: { id: 'u3', full_name: 'Pedro Lima', business_name: 'AdsMax PR', avatar_url: null, city: 'Curitiba', state: 'PR', is_verified: false, plan_type: 'Gratuito' as const },
    categories: { name: 'Marketing', color: 'rose', slug: 'marketing' },
  },
  {
    id: 'mock-4', user_id: 'u4', title: 'Contabilidade para MEI e Pequenas Empresas',
    category_id: '11111111-0006-0006-0006-000000000006', subcategory_id: null,
    description: 'BPO Financeiro, Contabilidade Digital e abertura de empresa.',
    price: 250, price_type: 'fixed', image_url: null, video_embed_url: null,
    location_city: 'Salvador', location_state: 'BA', is_active: true, views: 456,
    created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: '',
    profiles: { id: 'u4', full_name: 'Fernanda Costa', business_name: 'ContaFácil BA', avatar_url: null, city: 'Salvador', state: 'BA', is_verified: true, plan_type: 'Premium' as const },
    categories: { name: 'Financeiras', color: 'teal', slug: 'financeiras' },
  },
]

const MOCK_BENEFITS = [
  { id: 'b1', title: '30% Off em Software CRM Completo', discount_pct: 30, author: 'TechPro BR', category: 'Desenvolvedores' },
  { id: 'b2', title: 'Primeira Consultoria Financeira Grátis', discount_pct: 100, author: 'FinancePro MG', category: 'Financeiras' },
  { id: 'b3', title: '15% em Toda Publicidade Digital', discount_pct: 15, author: 'AdsMax SP', category: 'Marketing' },
]



export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar dados do perfil
  const { data: profile } = await serverDb
    .from('profiles')
    .select('full_name, business_name, is_verified, city, state')
    .eq('id', user.id)
    .single()

  // Buscar anúncios
  let listings: ListingWithProfile[] = []
  try {
    const { data } = await serverDb
      .from('listings')
      .select('*, profiles:user_id(id,full_name,business_name,avatar_url,city,state,is_verified,plan_type), categories:category_id(name,color,slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8)
    if (data && data.length > 0) listings = data as ListingWithProfile[]
    else listings = MOCK_LISTINGS
  } catch {
    listings = MOCK_LISTINGS
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Empreendedor'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* ===== BOAS-VINDAS ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-gray-500 flex items-center gap-1.5 mt-1 text-sm">
            <MapPin className="w-4 h-4 text-green-600" />
            {profile?.city || 'Configure sua cidade'}, {profile?.state || 'BR'}
            {profile?.is_verified && (
              <span className="ml-2 flex items-center gap-1 text-blue-600 font-semibold">
                <BadgeCheck className="w-4 h-4" /> Verificado
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/anuncio/novo" id="dashboard-new-listing"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-md hover:brightness-110 transition-all"
            style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
            <Plus className="w-4 h-4" /> Publicar Anúncio
          </Link>
          <Link href="/mensagens" id="dashboard-messages"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-gray-700 font-bold text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            <MessageCircle className="w-4 h-4" /> Mensagens
          </Link>
        </div>
      </div>

      {/* ===== BUSCA GLOBAL ===== */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          id="global-search"
          placeholder="Busque por empresa, serviço ou cidade..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-all"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
          <Filter className="w-4 h-4" /> Filtrar
        </button>
      </div>

      {/* ===== CLUBE DE BENEFÍCIOS (destaque) ===== */}
      <section className="mb-8">
        <div className="relative rounded-3xl overflow-hidden p-6 md:p-8"
          style={{ background: 'linear-gradient(135deg, #002776 0%, #004BA8 50%, #006FC0 100%)' }}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10" style={{ background: '#FEDF00' }} />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10" style={{ background: '#FEDF00' }} />
          </div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm uppercase tracking-wide">Clube de Benefícios</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Descontos exclusivos entre membros</h2>
              <p className="text-white/70 text-sm">Empreendedores que cuidam de empreendedores. Ofertas verificadas, sem pegadinhas.</p>
            </div>

            <div className="flex gap-3 shrink-0">
              {MOCK_BENEFITS.slice(0, 2).map((b) => (
                <div key={b.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 w-40">
                  <div className="text-2xl font-black text-yellow-400 mb-1">-{b.discount_pct}%</div>
                  <p className="text-white text-xs font-semibold leading-tight">{b.title}</p>
                  <p className="text-white/50 text-xs mt-1">{b.author}</p>
                </div>
              ))}
            </div>

            <Link href="/beneficios" id="dashboard-benefits-link"
              className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-green-950 text-sm transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}>
              Ver Todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIAS ===== */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-900">Segmentos</h2>
          <Link href="/categorias" className="text-green-700 font-semibold text-sm flex items-center gap-1 hover:underline">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <CategoryGrid />
      </section>

      {/* ===== FEED DE EMPRESAS ===== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">Diretório de Empresas</h2>
            <p className="text-gray-400 text-sm mt-0.5">Fornecedores e parceiros verificados</p>
          </div>
          <Link href="/anuncios" className="text-green-700 font-semibold text-sm flex items-center gap-1 hover:underline">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing, index) => (
            <React.Fragment key={listing.id}>
              <ListingCard listing={listing} />
              {/* Patrocinador fixo após o 4º card */}
              {index === 3 && (
                <div className="col-span-full">
                  <SponsorBanner variant="feed" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  )
}
