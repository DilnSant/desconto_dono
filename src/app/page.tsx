import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'
import { redirect } from 'next/navigation'




export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Desconto do Dono — Conexões e negócios locais',
  description:
    'Crie seu perfil gratuito, encontre empresas e empreendedores por cidade e categoria e inicie conversas pelo chat. Cadastre-se no Desconto do Dono.',
  openGraph: {
    title: 'Desconto do Dono — Clube de Descontos e Diretório de Empresas',
    description: 'Encontre negócios locais, conheça empreendedores e inicie conversas pelo chat da plataforma.',
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
