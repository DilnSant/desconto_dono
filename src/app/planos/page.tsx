import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { getPlanEntitlements, getPlanMonthlyPriceCents, type PlanType } from '@/lib/plans/entitlements'

export const metadata: Metadata = {
  title: 'Planos — Desconto do Dono',
  description: 'Compare os recursos e limites do cadastro gratuito e dos planos mensais do Desconto do Dono.',
}

const PLAN_TYPES: PlanType[] = ['Gratuito', 'Essencial', 'Profissional']
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function getPlanFeatures(plan: PlanType) {
  const entitlements = getPlanEntitlements(plan)

  return [
    `Até ${entitlements.maxNewActiveListings} anúncio${entitlements.maxNewActiveListings === 1 ? '' : 's'} novo${entitlements.maxNewActiveListings === 1 ? '' : 's'} ativo${entitlements.maxNewActiveListings === 1 ? '' : 's'}`,
    plan === 'Gratuito'
      ? '1 município de atuação, escolhido em qualquer estado'
      : `Até ${entitlements.maxMunicipalities} municípios ou atuação nacional para serviços digitais e não presenciais`,
    `${entitlements.maxSegments} segmento${entitlements.maxSegments === 1 ? '' : 's'} e até ${entitlements.maxSubcategories} subcategorias`,
    entitlements.maxProfilePhotos
      ? `Até ${entitlements.maxProfilePhotos} fotos adicionais no perfil`
      : 'Logomarca incluída no perfil',
    entitlements.publicContacts ? 'E-mail e WhatsApp públicos no perfil' : 'Contatos públicos não incluídos',
    'Chat e criação de conta',
  ]
}

export default function PlanosPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="grid gap-8 border-b border-gray-200 pb-10 md:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)] md:items-end">
        <div>
          <p className="mb-3 text-sm font-bold text-green-800">Planos transparentes</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-gray-950 sm:text-5xl">
            Comece sem pagar. Amplie quando fizer sentido.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
            Crie seu perfil, publique anúncios e converse pelo chat desde o primeiro dia.
            O cadastro gratuito já funciona em qualquer cidade do Brasil.
          </p>
        </div>
        <div className="border-l-4 border-yellow-400 bg-green-50 px-5 py-4 text-sm leading-relaxed text-green-950">
          No plano gratuito, escolha um município de atuação entre os disponíveis no Brasil.
          Cada anúncio pode informar sua própria cidade, conforme o local da oferta ou atendimento.
        </div>
      </header>

      <section aria-label="Comparação de planos" className="mt-9">
        <div className="grid overflow-hidden rounded-2xl border border-gray-200 md:grid-cols-3">
          {PLAN_TYPES.map((plan, index) => {
            const priceCents = getPlanMonthlyPriceCents(plan)
            const features = getPlanFeatures(plan)
            const isFree = plan === 'Gratuito'

            return (
              <article
                key={plan}
                className={`flex flex-col p-6 sm:p-8 ${index > 0 ? 'border-t border-gray-200 md:border-l md:border-t-0' : ''} ${isFree ? 'bg-green-50' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-gray-950">{plan}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {isFree ? 'Para começar e criar conexões' : 'Mais recursos para ampliar sua atuação'}
                    </p>
                  </div>
                  {isFree && (
                    <span className="rounded-full bg-green-800 px-3 py-1 text-xs font-bold text-white">
                      Comece aqui
                    </span>
                  )}
                </div>

                <p className="mt-7 text-3xl font-black tracking-tight text-gray-950">
                  {currency.format(priceCents / 100)}
                  <span className="ml-1 text-sm font-medium text-gray-500">/ mês</span>
                </p>

                <ul className="mt-7 flex-1 space-y-3 border-t border-gray-200 pt-5 text-sm text-gray-700">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isFree ? (
                  <Link
                    href="/cadastro"
                    className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 text-center font-bold text-green-950 transition-colors hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
                  >
                    Criar conta gratuita
                  </Link>
                ) : (
                  <p className="mt-8 border-t border-gray-200 pt-4 text-sm leading-relaxed text-gray-600">
                    A contratação mensal estará disponível quando o pagamento integrado for habilitado.
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="plan-terms-title" className="mt-10 grid gap-6 border-t border-gray-200 pt-8 md:grid-cols-2">
        <div>
          <h2 id="plan-terms-title" className="text-lg font-bold text-gray-950">O que cada preço significa</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            “Grátis”, “Fixo” e “Negociável” indicam o preço do produto ou serviço anunciado, não uma cobrança da plataforma.
            A assinatura dos planos pagos, quando disponível, é mensal.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-950">Verificação da empresa</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            O selo Empresa verificada depende da confirmação da equipe, não do plano contratado.
            Nenhum plano compra ou concede verificação.
          </p>
        </div>
      </section>

      <p className="mt-8 border-l-2 border-gray-300 pl-4 text-sm leading-relaxed text-gray-600">
        Os anúncios permanecem publicados enquanto estiverem ativos, respeitarem as regras da plataforma
        e não forem removidos pelo responsável ou pela moderação. No downgrade, anúncios novos acima da
        cota ficam preservados, mas inativos.
      </p>
    </main>
  )
}
