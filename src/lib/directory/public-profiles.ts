import type {
  Category,
  PublicListing,
  PublicListingWithProfile,
  PublicProfile,
} from '../../types/database.ts'

export interface PublicDirectoryProfile {
  id: string
  segment_ids: string[]
  service_area_ibge_codes: string[]
  service_area_state_codes: string[]
  service_area_names: string[]
  national_coverage: boolean
  city?: string
  state?: string
}

export interface PublicDirectoryFilters {
  ibgeCode?: string
  stateCode?: string
  categoryId?: string
}

export interface PublicDirectoryPostgrestFilters {
  locationOr: string | null
  categoryId: string | null
}

const IBGE_CODE_PATTERN = /^\d{7}$/
const STATE_CODE_PATTERN = /^[A-Z]{2}$/
const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i

function normalizeOptional(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized || undefined
}

export function buildPublicDirectoryFilters(
  filters: PublicDirectoryFilters,
): PublicDirectoryPostgrestFilters {
  const ibgeCode = normalizeOptional(filters.ibgeCode)
  const stateCode = normalizeOptional(filters.stateCode)?.toUpperCase()
  const categoryId = normalizeOptional(filters.categoryId)

  if (ibgeCode && !IBGE_CODE_PATTERN.test(ibgeCode)) {
    throw new Error('Código de município IBGE inválido.')
  }
  if (stateCode && !STATE_CODE_PATTERN.test(stateCode)) {
    throw new Error('Código de UF inválido.')
  }
  if (categoryId && !UUID_PATTERN.test(categoryId)) {
    throw new Error('Categoria inválida.')
  }

  const localConditions = [
    ibgeCode && `service_area_ibge_codes.cs.{${ibgeCode}}`,
    stateCode && `service_area_state_codes.cs.{${stateCode}}`,
  ].filter((condition): condition is string => Boolean(condition))

  return {
    locationOr: localConditions.length
      ? `${localConditions.length > 1 ? `and(${localConditions.join(',')})` : localConditions[0]},national_coverage.eq.true`
      : null,
    categoryId: categoryId ?? null,
  }
}

export function matchesPublicDirectoryFilters(
  profile: PublicDirectoryProfile,
  filters: PublicDirectoryFilters,
): boolean {
  const normalized = buildPublicDirectoryFilters(filters)
  const ibgeCode = normalizeOptional(filters.ibgeCode)
  const stateCode = normalizeOptional(filters.stateCode)?.toUpperCase()
  const matchesLocalArea =
    (!ibgeCode || profile.service_area_ibge_codes.includes(ibgeCode))
    && (!stateCode || profile.service_area_state_codes.includes(stateCode))
  const matchesLocation =
    (!ibgeCode && !stateCode)
    || profile.national_coverage
    || matchesLocalArea
  const matchesCategory =
    !normalized.categoryId || profile.segment_ids.includes(normalized.categoryId)

  return matchesLocation && matchesCategory
}

export function getPublicCoverageLabel(profile: PublicDirectoryProfile): string {
  if (profile.national_coverage) return 'Atuação nacional'
  return profile.service_area_names[0] || `${profile.city || ''}, ${profile.state || ''}`.trim()
}

export function attachPublicListingRelations(
  listings: PublicListing[],
  profiles: PublicProfile[],
  categories: Array<Pick<Category, 'id' | 'name' | 'color' | 'slug'>>,
): PublicListingWithProfile[] {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  const categoriesById = new Map(categories.map((category) => [category.id, category]))

  return listings.flatMap((listing) => {
    const profile = profilesById.get(listing.user_id)
    if (!profile) return []

    return [{
      ...listing,
      profiles: profile,
      categories: listing.category_id
        ? categoriesById.get(listing.category_id) ?? null
        : null,
    }]
  })
}
