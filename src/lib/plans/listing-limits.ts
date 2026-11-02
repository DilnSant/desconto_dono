import { getPlanEntitlements, type PlanType } from './entitlements.ts'

export interface CountableListing {
  is_active: boolean
  grandfathered: boolean
}

export function getCountableActiveListingCount(listings: CountableListing[]): number {
  return listings.filter((listing) => listing.is_active && !listing.grandfathered).length
}

export function canCreateNewActiveListing(plan: PlanType, count: number): boolean {
  if (!Number.isInteger(count) || count < 0) return false
  return count < getPlanEntitlements(plan).maxNewActiveListings
}
