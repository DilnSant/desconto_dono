import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'
import { redirect } from 'next/navigation'




export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Desconto do Dono — O Clube de Descontos que mais cresce no Brasil',
  description:
    'O Clube de Descontos e Diretório de Empresas que mais cresce no Brasil. Encontre empresas verificadas, resgate ofertas exclusivas e faça parte da maior rede de empreendedores. Cadastre-se grátis.',
  openGraph: {
    title: 'Desconto do Dono — Clube de Descontos e Diretório de Empresas',
    description: 'Resgate descontos exclusivos e conecte-se com empresas verificadas. O clube de empreendedores brasileiros.',
    type: 'website',
  },
}



export default async function HomePage() {
  // Usuário logado vai direto ao dashboard
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return <LandingPage />
}
