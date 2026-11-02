import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Star, Plus } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db as serverDb } from '@/lib/supabase/db'
import BeneficiosFeed from './BeneficiosFeed'
import type { Category, PublicProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Clube de Descontos — Desconto do Dono',
  description: 'Descontos exclusivos oferecidos por empresas e empreendedores verificados do Desconto do Dono.',
}

export default async function BeneficiosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let benefits: Array<{
    id: string
    title: string
    description: string
    discount_pct: number | null
    discount_val: number | null
    author: string
    business: string
    category: string
    valid_until: string | null
    redemptions: number
    avatar_url: string | null
    is_verified: boolean
    link_url: string | null
  }> = []
  let queryError = false
  try {
    const { data, error } = await serverDb
      .from('benefits')
      .select('id, title, description, discount_pct, discount_val, author_id, category_id, valid_until, redemptions, link_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error

    const authorIds = Array.from(new Set((data ?? []).map((benefit: { author_id: string }) => benefit.author_id)))
    const categoryIds = Array.from(new Set((data ?? []).flatMap((benefit: { category_id: string | null }) => benefit.category_id ? [benefit.category_id] : [])))
    const [profilesResult, categoriesResult] = await Promise.all([
      authorIds.length
        ? serverDb.from('profiles_public').select('id, full_name, business_name, avatar_url, is_verified, public_whatsapp').in('id', authorIds)
        : { data: [], error: null },
      categoryIds.length
        ? serverDb.from('categories').select('id, name').in('id', categoryIds)
        : { data: [], error: null },
    ])
    if (profilesResult.error) throw profilesResult.error
    if (categoriesResult.error) throw categoriesResult.error

    const profiles = new Map(
      ((profilesResult.data ?? []) as Pick<PublicProfile, 'id' | 'full_name' | 'business_name' | 'avatar_url' | 'is_verified' | 'public_whatsapp'>[])
        .map((profile) => [profile.id, profile]),
    )
    const categories = new Map(
      ((categoriesResult.data ?? []) as Pick<Category, 'id' | 'name'>[])
        .map((category) => [category.id, category.name]),
    )
    benefits = (data ?? []).flatMap((benefit: {
      id: string
      title: string
      description: string
      discount_pct: number | null
      discount_val: number | null
      author_id: string
      category_id: string | null
      valid_until: string | null
      redemptions: number
      link_url: string | null
    }) => {
      const profile = profiles.get(benefit.author_id)
      if (!profile) return []
      return [{
        id: benefit.id,
        title: benefit.title,
        description: benefit.description,
        discount_pct: benefit.discount_pct,
        discount_val: benefit.discount_val,
        author: profile.full_name,
        business: profile.business_name || profile.full_name,
        category: benefit.category_id ? categories.get(benefit.category_id) || 'Outros' : 'Outros',
        valid_until: benefit.valid_until,
        redemptions: benefit.redemptions,
        avatar_url: profile.avatar_url,
        is_verified: profile.is_verified,
        link_url: benefit.link_url,
      }]
    })
  } catch (error) {
    console.error('[BENEFÍCIOS] Falha ao carregar ofertas públicas', error)
    queryError = true
  }

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

      {queryError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          Não foi possível carregar os benefícios. Atualize a página para tentar novamente.
        </div>
      ) : benefits.length > 0 ? (
        <BeneficiosFeed benefits={benefits} />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center">
          <p className="font-semibold text-gray-800">Ainda não há benefícios ativos.</p>
          <p className="mt-2 text-sm text-gray-600">Você pode publicar uma oferta para a comunidade.</p>
        </div>
      )}

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
