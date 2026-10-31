'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Search, Menu, X, MessageCircle, User, LogOut, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUnreadCount, getUnreadCount, type UnreadCountState } from '@/lib/messages/unread-count'

interface HeaderProps {
  user?: { id: string; email?: string } | null
  onSearch?: (query: string) => void
}

export default function Header({ user, onSearch }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadMessages, setUnreadMessages] = useState<UnreadCountState | null>(null)
  const router = useRouter()
  const userId = user?.id

  useEffect(() => {
    if (!userId) return

    let active = true
    getUnreadCount(supabase, userId).then((count) => {
      if (active) setUnreadMessages({ userId, count })
    })

    return () => {
      active = false
    }
  }, [userId])

  const unreadCount = getCurrentUnreadCount(unreadMessages, userId)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) onSearch(searchQuery)
    else router.push(`/?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full shadow-lg" style={{ background: 'linear-gradient(135deg, #005C2D 0%, #007A3D 40%, #009950 60%, #005C2D 100%)' }}>
      {/* Faixa decorativa Brasil */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #009B3A 33%, #FEDF00 33%, #FEDF00 66%, #002776 66%)' }} />

      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">

          {/* Logo */}
          <Link href="/" className="flex min-w-0 items-center gap-2 shrink-0 group">
            <Image
              src="/images/LogoTransp..png"
              alt="Desconto do Dono"
              width={1024}
              height={572}
              className="h-13 w-auto shrink-0 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-16"
            />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-sm font-bold text-white sm:text-lg">Desconto do Dono</span>
              <span className="hidden text-xs text-white/80 sm:block">
                Vantagens reais. Negócios locais.
              </span>
            </span>
          </Link>

          {/* Barra de pesquisa */}
          <form onSubmit={handleSearch} className="order-3 w-full min-w-0 sm:order-none sm:flex-1 sm:max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-green-600 transition-colors" />
              <input
                id="header-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar descontos, empresas, categorias..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/95 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all duration-200 shadow-inner"
              />
            </div>
          </form>

          {/* Ações Desktop */}
          <div className="order-2 ml-auto hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link
                  href="/anuncio/novo"
                  id="btn-novo-anuncio"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-green-900 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="flex flex-col items-start leading-tight">
                    <span>Anunciar</span>
                    <span className="text-[10px] font-bold">Gratuito</span>
                  </span>
                </Link>
                <Link
                  href="/mensagens"
                  id="btn-mensagens"
                  className="p-2 rounded-xl text-white hover:bg-white/20 transition-colors relative"
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount !== null && unreadCount > 0 && (
                    <span
                      aria-label={`${unreadCount} mensagens não lidas`}
                      className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/perfil"
                  id="btn-perfil"
                  className="p-2 rounded-xl text-white hover:bg-white/20 transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  id="btn-logout"
                  onClick={async () => {
                    const { supabase } = await import('@/lib/supabase/client')
                    await supabase.auth.signOut()
                    router.push('/')
                    router.refresh()
                  }}
                  className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  id="btn-login"
                  className="px-4 py-2 rounded-xl text-white font-medium text-sm hover:bg-white/20 transition-colors border border-white/30"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  id="btn-cadastro"
                  className="px-4 py-2 rounded-xl font-semibold text-sm text-green-900 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
                >
                  Cadastrar-se
                </Link>
              </>
            )}
          </div>

          {/* Menu Mobile */}
          <button
            id="btn-menu-mobile"
            className="order-2 p-2 rounded-xl text-white hover:bg-white/20 transition-colors md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu Mobile Dropdown */}
        {menuOpen && (
          <div className="md:hidden mt-3 pb-2 border-t border-white/20 pt-3 flex flex-col gap-2 animate-in slide-in-from-top duration-200">
            {user ? (
              <>
                <Link href="/anuncio/novo" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-green-900 font-semibold text-sm"
                  style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
                  onClick={() => setMenuOpen(false)}>
                  <Plus className="w-4 h-4" />
                  <span className="flex flex-col leading-tight">
                    <span>Novo Anúncio</span>
                    <span className="text-[10px] font-bold">Gratuito</span>
                  </span>
                </Link>
                <Link href="/mensagens" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white hover:bg-white/20 transition-colors"
                  onClick={() => setMenuOpen(false)}>
                  <MessageCircle className="w-4 h-4" /> Mensagens
                </Link>
                <Link href="/perfil" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white hover:bg-white/20 transition-colors"
                  onClick={() => setMenuOpen(false)}>
                  <User className="w-4 h-4" /> Meu Perfil
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2.5 rounded-xl text-white border border-white/30 text-sm text-center"
                  onClick={() => setMenuOpen(false)}>
                  Entrar
                </Link>
                <Link href="/cadastro" className="px-4 py-2.5 rounded-xl text-green-900 font-semibold text-sm text-center"
                  style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
                  onClick={() => setMenuOpen(false)}>
                  Cadastrar-se
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
