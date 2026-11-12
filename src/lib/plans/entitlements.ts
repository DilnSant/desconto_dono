export type PlanType = 'Gratuito' | 'Essencial' | 'Profissional'

export type PlanEntitlements = Readonly<{
  maxNewActiveListings: number
  maxMunicipalities: number
  allowsNationalCoverage: boolean
  maxSegments: number
  maxSubcategories: number
  maxProfilePhotos: number
  publicContacts: boolean
}>

const PLAN_ENTITLEMENTS: Readonly<Record<PlanType, PlanEntitlements>> = Object.freeze({
  Gratuito: Object.freeze({
    maxNewActiveListings: 1,
    maxMunicipalities: 1,
    allowsNationalCoverage: false,
    maxSegments: 1,
    maxSubcategories: 3,
    maxProfilePhotos: 0,
    publicContacts: false,
  }),
  Essencial: Object.freeze({
    maxNewActiveListings: 3,
    maxMunicipalities: 3,
    allowsNationalCoverage: true,
    maxSegments: 2,
    maxSubcategories: 6,
    maxProfilePhotos: 3,
    publicContacts: true,
  }),
  Profissional: Object.freeze({
    maxNewActiveListings: 5,
    maxMunicipalities: 5,
    allowsNationalCoverage: true,
    maxSegments: 3,
    maxSubcategories: 10,
    maxProfilePhotos: 10,
    publicContacts: true,
  }),
})

const PLAN_MONTHLY_PRICE_CENTS: Readonly<Record<PlanType, number>> = Object.freeze({
  Gratuito: 0,
  Essencial: 3990,
  Profissional: 6990,
})

export function getPlanEntitlements(plan: PlanType): PlanEntitlements {
  if (!Object.hasOwn(PLAN_ENTITLEMENTS, plan)) {
    throw new RangeError(`Unknown plan: ${String(plan)}`)
  }

  return PLAN_ENTITLEMENTS[plan]
}

export function getPlanMonthlyPriceCents(plan: PlanType): number {
  if (!Object.hasOwn(PLAN_MONTHLY_PRICE_CENTS, plan)) {
    throw new RangeError(`Unknown plan: ${String(plan)}`)
  }

  return PLAN_MONTHLY_PRICE_CENTS[plan]
}

export function normalizeStoredPlanType(value: string): PlanType {
  switch (value) {
    case 'Gratuito':
    case 'Essencial':
    case 'Profissional':
      return value
    case 'Premium':
      return 'Gratuito'
    default:
      throw new RangeError(`Unknown stored plan: ${value}`)
  }
}
