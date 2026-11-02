export interface CategoryOption {
  id: string
  name: string
  subcategories: Array<{
    id: string
    category_id: string
    name: string
  }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseCategoryCatalog(value: unknown): CategoryOption[] | null {
  if (!Array.isArray(value) || value.length === 0) return null

  const categories: CategoryOption[] = []
  const categoryIds = new Set<string>()
  const subcategoryIds = new Set<string>()
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.name !== 'string' ||
      !Array.isArray(item.subcategories)
    ) {
      return null
    }
    if (categoryIds.has(item.id)) return null
    categoryIds.add(item.id)

    const subcategories: CategoryOption['subcategories'] = []
    for (const subcategory of item.subcategories) {
      if (
        !isRecord(subcategory) ||
        typeof subcategory.id !== 'string' ||
        typeof subcategory.category_id !== 'string' ||
        typeof subcategory.name !== 'string' ||
        subcategory.category_id !== item.id
      ) {
        return null
      }
      if (subcategoryIds.has(subcategory.id)) return null
      subcategoryIds.add(subcategory.id)
      subcategories.push({
        id: subcategory.id,
        category_id: subcategory.category_id,
        name: subcategory.name,
      })
    }

    categories.push({
      id: item.id,
      name: item.name,
      subcategories,
    })
  }

  return categories
}

export function getSubcategoryCategoryLookup(
  categories: CategoryOption[],
): ReadonlyMap<string, string> {
  return new Map(
    categories.flatMap((category) =>
      category.subcategories.map((subcategory) => [subcategory.id, category.id] as const),
    ),
  )
}
