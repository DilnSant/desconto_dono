'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { PlanType } from '@/lib/plans/entitlements'

type Props = {
  plan: PlanType
  profileId: string | null
}

export default function CheckoutButton({ plan, profileId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setError(null)

    if (!profileId) {
      router.push(`/login?redirect=/planos`)
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/asaas/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planType: plan, profileId }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Erro ao iniciar pagamento. Tente novamente.')
          return
        }

        // Redirecionar para o link de pagamento do Asaas
        if (data.paymentLink) {
          window.location.href = data.paymentLink
        }
      } catch {
        setError('Erro de conexão. Verifique sua internet e tente novamente.')
      }
    })
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        id={`btn-assinar-${plan.toLowerCase()}`}
        onClick={handleCheckout}
        disabled={isPending}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-800 px-5 py-3 text-center font-bold text-white transition-colors hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Aguarde…
          </>
        ) : (
          `Assinar plano ${plan}`
        )}
      </button>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          <p>{error}</p>
          {error.includes('já possui uma assinatura') && (
            <Link href="/assinatura" className="mt-1 inline-block font-semibold underline">
              Gerenciar ou cancelar assinatura
            </Link>
          )}
        </div>
      )}

      <p className="text-center text-xs text-gray-500">
        Pagamento seguro via{' '}
        <span className="font-semibold text-gray-700">Asaas</span>
        {' · '}Cartão de crédito recorrente
      </p>
    </div>
  )
}
