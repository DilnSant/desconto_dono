'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Send, ArrowLeft, Shield, MoreVertical, Phone, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/supabase/db'
import { formatRelativeDate, getInitials } from '@/lib/utils/helpers'
import type { Message, Profile } from '@/types/database'
import { cn } from '@/lib/utils/helpers'

interface ChatWindowProps {
  currentUserId: string
  otherUser: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'is_verified' | 'whatsapp'>
  listingId?: string
}

export default function ChatWindow({ currentUserId, otherUser, listingId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Carregar histórico de mensagens
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true)
      const { data } = await db
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUser.id}),` +
          `and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
      setLoading(false)

      // Marcar como lidas
      await db
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', otherUser.id)
        .eq('is_read', false)
    }

    loadMessages()

    // Realtime: ouvir novas mensagens
    const channel = supabase
      .channel(`chat-${currentUserId}-${otherUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          if (msg.sender_id === otherUser.id) {
            setMessages((prev) => [...prev, msg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherUser.id])

  // Auto-scroll para última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return

    setSending(true)
    setNewMessage('')

    const { data, error } = await db.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      listing_id: listingId || null,
      content,
    }).select().single()

    if (data && !error) {
      setMessages((prev) => [...prev, data])
    }

    setSending(false)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header do chat */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100"
        style={{ background: 'linear-gradient(135deg, #009B3A 0%, #005C2D 100%)' }}>

        <button
          id="chat-back"
          className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors md:hidden"
          onClick={() => history.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar do interlocutor */}
        {otherUser.avatar_url ? (
          <Image src={otherUser.avatar_url} alt={otherUser.full_name} width={40} height={40}
            className="rounded-full object-cover border-2 border-yellow-400" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-green-900 font-bold text-sm border-2 border-yellow-400">
            {getInitials(otherUser.full_name)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{otherUser.full_name}</p>
          <div className="flex items-center gap-1">
            {otherUser.is_verified && <Shield className="w-3 h-3 text-blue-300" />}
            <span className="text-white/70 text-xs">
              {otherUser.is_verified ? 'Perfil Verificado' : 'Ordem & Negócios'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {otherUser.whatsapp && (
            <a
              href={`https://wa.me/55${otherUser.whatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              id="chat-whatsapp"
              className="p-2 rounded-xl text-white hover:bg-white/20 transition-colors"
              title="WhatsApp"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          <button className="p-2 rounded-xl text-white hover:bg-white/20 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aviso de segurança */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700">
          Por sua segurança, negocie sempre pelo Ordem & Negócios. Não faça pagamentos externos.
        </p>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ background: 'linear-gradient(180deg, #f8fdf9 0%, #f0f9f0 100%)' }}>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
              <Send className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Inicie a conversa!</p>
              <p className="text-gray-400 text-sm">Envie uma mensagem para {otherUser.full_name}</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm',
                  isMine
                    ? 'text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                )}
                  style={isMine ? { background: 'linear-gradient(135deg, #009B3A, #005C2D)' } : {}}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={cn('text-xs mt-1', isMine ? 'text-white/60' : 'text-gray-400')}>
                    {formatRelativeDate(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input de mensagem */}
      <form onSubmit={handleSend}
        className="flex items-end gap-2 px-4 py-3 border-t border-gray-100 bg-white">
        <textarea
          id="chat-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(e)
            }
          }}
          placeholder={`Mensagem para ${otherUser.full_name}...`}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          id="chat-send"
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-3 rounded-xl text-white transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100 shadow-md hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
