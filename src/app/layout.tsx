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
    default: 'Desconto do Dono | O Clube de Descontos e Negócios Locais',
    template: '%s | Desconto do Dono',
  },
  description:
    'Conectando empresas locais a consumidores através de vídeo marketing e descontos exclusivos.',
  keywords: [
    'desconto do dono', 'clube de descontos', 'negócios locais', 'vídeo marketing',
    'empresas locais', 'descontos exclusivos', 'promoções', 'empreendedores brasileiros',
  ],
  authors: [{ name: 'Desconto do Dono' }],
  creator: 'Desconto do Dono',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://descontododono.com.br',
    title: 'Desconto do Dono | O Clube de Descontos e Negócios Locais',
    description: 'Conectando empresas locais a consumidores através de vídeo marketing e descontos exclusivos.',
    siteName: 'Desconto do Dono',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Desconto do Dono | O Clube de Descontos e Negócios Locais',
    description: 'Conectando empresas locais a consumidores através de vídeo marketing e descontos exclusivos.',
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
