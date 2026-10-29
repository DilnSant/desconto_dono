import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import Footer from '@/components/layout/Footer'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Ordem & Negócios — Networking B2B/B2C para Empreendedores',
    template: '%s | Ordem & Negócios',
  },
  description:
    'Conecte-se com empreendedores brasileiros, divulgue seus serviços e feche negócios com segurança. A plataforma B2B/B2C que o Brasil estava esperando.',
  keywords: [
    'empreendedores brasileiros', 'classificados', 'networking', 'B2B', 'B2C',
    'serviços', 'anúncios', 'negócios', 'ordem e negócios',
  ],
  authors: [{ name: 'Ordem & Negócios' }],
  creator: 'Ordem & Negócios',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://ordemenegocios.com.br',
    title: 'Ordem & Negócios — Networking B2B/B2C para Empreendedores',
    description: 'Conecte-se com empreendedores brasileiros e impulsione seus negócios.',
    siteName: 'Ordem & Negócios',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ordem & Negócios',
    description: 'Networking e classificados para empreendedores brasileiros',
  },
  robots: { index: true, follow: true },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Header user={user} />
        <main className="pb-20 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
