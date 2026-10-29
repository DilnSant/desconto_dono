'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Plus, MessageCircle, Star, User } from 'lucide-react'
import SponsorBanner from '@/components/ui/SponsorBanner'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Início' },
  { href: '/anuncios', icon: Search, label: 'Buscar' },
  { href: '/anuncio/novo', icon: Plus, label: 'Publicar', highlight: true },
  { href: '/beneficios', icon: Star, label: 'Descontos' },
  { href: '/mensagens', icon: MessageCircle, label: 'Chat' },
  { href: '/perfil', icon: User, label: 'Perfil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {/* Faixa de patrocínio acima do nav */}
      <SponsorBanner variant="bottom-nav" />

      <div className="grid grid-cols-6 h-16">
        {NAV_ITEMS.map(({ href, icon: Icon, label, highlight }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                highlight
                  ? 'relative'
                  : active ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {highlight ? (
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg -mt-4"
                  style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                  <Icon className="w-6 h-6 text-white" />
                </span>
              ) : (
                <>
                  <Icon className={`w-5 h-5 ${active ? 'text-green-700' : ''}`} />
                  <span className={`text-[10px] font-medium ${active ? 'text-green-700 font-bold' : ''}`}>{label}</span>
                  {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-green-600" />}
                </>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
