'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

type Props = { paidThrough: string | null }

export default function CancelSubscriptionButton({ paidThrough }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function cancel() {
    const date = paidThrough
      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(paidThrough))
      : 'o fim do período vigente'
    if (!window.confirm(`Parar as próximas cobranças? Cobranças já emitidas continuam válidas. Seu acesso pago será mantido até ${date}.`)) return

    setError(null)
    setNotice(null)
    startTransition(async () => {
      try {
        const response = await fetch('/api/asaas/cancel', { method: 'POST' })
        const data = await response.json()
        if (!response.ok) {
          setError(data.error ?? 'Não foi possível cancelar a assinatura.')
          return
        }
        setNotice(data.alreadyCanceled ? 'A assinatura já estava cancelada.' : 'Assinatura cancelada. As próximas cobranças foram encerradas.')
        router.refresh()
      } catch {
        setError('Erro de conexão. Verifique sua internet e tente novamente.')
      }
    })
  }

  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={cancel}
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-bold text-red-800 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cancelando…</> : 'Cancelar próximas cobranças'}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-green-800">{notice}</p>}
    </div>
  )
}
