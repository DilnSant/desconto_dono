import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'
import { redirect } from 'next/navigation'




export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Desconto do Dono — Vitrine com Vídeo do Dono e Negócios Locais',
  description:
    'Conecte seu negócio diretamente a clientes da sua cidade. Vídeo do dono, catálogo em 5.571 municípios (IBGE) e contato direto via WhatsApp sem comissão.',
  openGraph: {
    title: 'Desconto do Dono — Vitrine com Vídeo do Dono e Negócios Locais',
    description: 'Encontre negócios locais, conheça o dono por vídeo e feche negócios diretamente pelo WhatsApp sem intermediários.',
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
