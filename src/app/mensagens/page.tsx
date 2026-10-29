'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  MessageCircle, Search, ArrowLeft, Clock, User,
  BadgeCheck, ChevronRight, Inbox
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import ChatWindow from '@/components/chat/ChatWindow'
import { getInitials, formatRelativeDate } from '@/lib/utils/helpers'
import type { Profile } from '@/types/database'

interface Conversation {
  id: string
  other_user: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'is_verified' | 'whatsapp'>
  last_message: string
  last_message_at: string
  unread: number
}

export default function MensagensPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paraId = searchParams.get('para')
  const anuncioId = searchParams.get('anuncio')

  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUser, setSelectedUser] = useState<Conversation['other_user'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUser(user)

      // Buscar conversas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: msgs } = await (supabase as any)
        .from('messages')
        .select('sender_id, receiver_id, content, created_at, is_read')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (msgs) {
        // Agrupar por interlocutor
        const convMap = new Map<string, Conversation>()
        for (const msg of msgs) {
          const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
          if (!convMap.has(otherId)) {
            convMap.set(otherId, {
              id: otherId,
              other_user: { id: otherId, full_name: 'Carregando...', avatar_url: null, is_verified: false, whatsapp: null },
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread: (!msg.is_read && msg.receiver_id === user.id) ? 1 : 0,
            })
          } else if (!msg.is_read && msg.receiver_id === user.id) {
            const existing = convMap.get(otherId)!
            convMap.set(otherId, { ...existing, unread: existing.unread + 1 })
          }
        }

        // Buscar perfis dos interlocutores
        const ids = Array.from(convMap.keys())
        if (ids.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profiles } = await (supabase as any)
            .from('profiles')
            .select('id, full_name, avatar_url, is_verified, whatsapp')
            .in('id', ids)

          profiles?.forEach((p: { id: string; full_name: string; avatar_url: string | null; is_verified: boolean; whatsapp: string | null }) => {
            const conv = convMap.get(p.id)
            if (conv) convMap.set(p.id, { ...conv, other_user: p })
          })
        }

        setConversations(Array.from(convMap.values()))
      }

      // Se veio com ?para=userId, abrir chat direto
      if (paraId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('id, full_name, avatar_url, is_verified, whatsapp')
          .eq('id', paraId)
          .single()
        if (profile) setSelectedUser(profile)
      }

      setLoading(false)
    }
    init()
  }, [paraId, router])

  if (!currentUser && !loading) {
    return null
  }

  const filtered = conversations.filter((c) =>
    c.other_user.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-0 md:px-4 py-0 md:py-6">
      <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-128px)] bg-white md:rounded-3xl md:border border-gray-100 md:shadow-sm overflow-hidden">

        {/* ===== LISTA DE CONVERSAS ===== */}
        <div className={`flex flex-col w-full md:w-80 border-r border-gray-100 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {/* Cabeçalho */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-black text-gray-900">Mensagens</h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                {conversations.reduce((a, c) => a + c.unread, 0)} novas
              </span>
            </div>
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="search-conversations"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversa..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded-full w-3/4" />
                      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-100">
                  <Inbox className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Nenhuma conversa</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Encontre um anúncio e inicie uma negociação!
                  </p>
                </div>
                <Link href="/" className="text-sm text-green-700 font-semibold hover:underline">
                  Ver anúncios →
                </Link>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  id={`conv-${conv.id}`}
                  onClick={() => setSelectedUser(conv.other_user)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${selectedUser?.id === conv.other_user.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {conv.other_user.avatar_url ? (
                      <Image src={conv.other_user.avatar_url} alt={conv.other_user.full_name}
                        width={48} height={48} className="rounded-2xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                        {getInitials(conv.other_user.full_name)}
                      </div>
                    )}
                    {conv.other_user.is_verified && (
                      <BadgeCheck className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500 bg-white rounded-full" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold truncate ${conv.unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {conv.other_user.full_name}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {formatRelativeDate(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate ${conv.unread > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                        {conv.last_message}
                      </p>
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ml-2"
                          style={{ background: '#009B3A' }}>
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ===== JANELA DE CHAT ===== */}
        <div className={`flex-1 ${selectedUser ? 'flex' : 'hidden md:flex'} flex-col`}>
          {selectedUser && currentUser ? (
            <ChatWindow
              currentUserId={currentUser.id}
              otherUser={selectedUser}
              listingId={anuncioId || undefined}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                <MessageCircle className="w-10 h-10 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-800 mb-2">Suas mensagens seguras</h2>
                <p className="text-gray-500 max-w-sm">
                  Selecione uma conversa ou navegue pelos anúncios para iniciar uma negociação com segurança.
                </p>
              </div>
              <Link href="/" className="mt-2 px-6 py-3 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                Ver Anúncios
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
