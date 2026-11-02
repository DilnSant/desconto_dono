export function normalizeBenefitLocation(
  city: string,
  state: string
): { location_city: string | null; location_state: string | null } {
  const normalizedCity = city.trim()
  const normalizedState = state.trim().toUpperCase()

  return {
    location_city: normalizedCity || null,
    location_state: normalizedState || null,
  }
}
