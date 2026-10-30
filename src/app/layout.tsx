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

// URL base do domínio de produção (substitua pelo seu domínio personalizado na Vercel quando ativado)
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://descontododono.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Desconto do Dono | O Clube de Descontos e Negócios Locais',
    template: '%s | Desconto do Dono',
  },
  description:
    'A ponte que conecta os melhores empreendedores do Brasil. Networking e vantagens exclusivas.',
  keywords: [
    'desconto do dono', 'clube de descontos', 'negócios locais', 'vídeo marketing',
    'empresas locais', 'descontos exclusivos', 'promoções', 'empreendedores brasileiros',
    'networking empresarial',
  ],
  authors: [{ name: 'Desconto do Dono' }],
  creator: 'Desconto do Dono',
  icons: {
    icon: '/images/logo.DDD2.jpeg',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl, // URL do domínio de produção (substitua pelo domínio real caso diferente)
    title: 'Desconto do Dono | O Clube de Descontos e Negócios Locais',
    description:
      'A ponte que conecta os melhores empreendedores do Brasil. Networking e vantagens exclusivas.',
    siteName: 'Desconto do Dono',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Desconto do Dono | O Clube de Descontos e Negócios Locais',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Desconto do Dono | O Clube de Descontos e Negócios Locais',
    description:
      'A ponte que conecta os melhores empreendedores do Brasil. Networking e vantagens exclusivas.',
    images: ['/opengraph-image.png'],
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
        <Footer />
        <BottomNav />
      </body>
    </html>
  )
}
