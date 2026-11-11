import { getPlanEntitlements, type PlanType } from '../plans/entitlements.ts'
import type { Municipality } from '../geography/municipalities.ts'

export type CoverageSelection =
  | { scope: 'municipalities'; municipalities: Municipality[] }
  | { scope: 'national'; declaredNonPresential: boolean }

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export type ServiceAudience = 'commercial' | 'residential'

export interface ProfileSegmentSelection {
  segments: Array<{
    categoryId: string
    subcategoryIds: string[]
    isPrimary: boolean
    serviceAudiences: ServiceAudience[]
  }>
}

export function validateCoverageSelection(
  plan: PlanType,
  selection: CoverageSelection,
): ValidationResult {
  const entitlements = getPlanEntitlements(plan)
  const errors: string[] = []

  if (selection.scope === 'national') {
    if (!entitlements.allowsNationalCoverage) {
      errors.push('Atuação nacional está disponível apenas nos planos pagos.')
    }
    if (!selection.declaredNonPresential) {
      errors.push('A atuação nacional exige declaração de atendimento não presencial.')
    }
    return { valid: errors.length === 0, errors }
  }

  if (selection.municipalities.length === 0) {
    errors.push('Selecione pelo menos um município.')
  }
  if (selection.municipalities.length > entitlements.maxMunicipalities) {
    errors.push(`Seu plano permite até ${entitlements.maxMunicipalities} município(s).`)
  }

  const municipalityCodes = new Set<string>()
  for (const municipality of selection.municipalities) {
    if (!/^\d{7}$/.test(municipality.ibgeCode) || !municipality.name.trim() || !/^[A-Z]{2}$/.test(municipality.stateCode)) {
      errors.push('Selecione municípios válidos da lista oficial.')
      continue
    }
    if (municipalityCodes.has(municipality.ibgeCode)) {
      errors.push('Não é possível cadastrar um município duplicado.')
    }
    municipalityCodes.add(municipality.ibgeCode)
  }

  return { valid: errors.length === 0, errors }
}

export function validateProfileSegments(
  plan: PlanType,
  selection: ProfileSegmentSelection,
  subcategoryCategoryById: ReadonlyMap<string, string>,
): ValidationResult {
  const entitlements = getPlanEntitlements(plan)
  const errors: string[] = []

  if (selection.segments.length > entitlements.maxSegments) {
    errors.push(`Seu plano permite até ${entitlements.maxSegments} segmento(s).`)
  }
  if (
    selection.segments.length > 0 &&
    selection.segments.filter((segment) => segment.isPrimary).length !== 1
  ) {
    errors.push('Defina exatamente um segmento principal.')
  }

  const categoryIds = new Set<string>()
  const subcategoryIds = new Set<string>()
  let subcategoryCount = 0

  for (const segment of selection.segments) {
    if (!segment.categoryId.trim()) {
      errors.push('Cada segmento precisa ter uma categoria.')
    } else if (categoryIds.has(segment.categoryId)) {
      errors.push('Não é possível cadastrar um segmento duplicado.')
    }
    categoryIds.add(segment.categoryId)

    const selectedAudiences = Array.isArray(segment.serviceAudiences)
      ? segment.serviceAudiences
      : ['commercial', 'residential']
    const serviceAudiences = new Set(selectedAudiences)
    if (
      serviceAudiences.size === 0
      || serviceAudiences.size !== selectedAudiences.length
      || Array.from(serviceAudiences).some((audience) => audience !== 'commercial' && audience !== 'residential')
    ) {
      errors.push('Selecione Comercial, Residencial ou ambos para cada segmento.')
    }

    for (const subcategoryId of segment.subcategoryIds) {
      subcategoryCount += 1
      if (subcategoryIds.has(subcategoryId)) {
        errors.push('Não é possível cadastrar uma subcategoria duplicada.')
      }
      subcategoryIds.add(subcategoryId)

      if (subcategoryCategoryById.get(subcategoryId) !== segment.categoryId) {
        errors.push('A subcategoria selecionada não pertence ao segmento escolhido.')
      }
    }
  }

  if (subcategoryCount > entitlements.maxSubcategories) {
    errors.push(`Seu plano permite até ${entitlements.maxSubcategories} subcategoria(s).`)
  }

  return { valid: errors.length === 0, errors }
}
