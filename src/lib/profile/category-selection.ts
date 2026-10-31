export interface ProfileCategorySelection {
  categoryIds: string[]
  subcategoryIds: string[]
  primaryCategoryId: string | null
  primarySubcategoryId: string | null
}

interface ProfileCategoryRecord {
  category_ids?: string[] | null
  subcategory_ids?: string[] | null
  primary_category_id?: string | null
  primary_subcategory_id?: string | null
  category_id?: string | null
  subcategory_id?: string | null
}

type SubcategoryCategoryMap = Record<string, string>

const uniqueIds = (ids: string[] | null | undefined): string[] =>
  [...new Set((ids ?? []).filter((id) => typeof id === 'string' && id.length > 0))]

const copySelection = (selection: ProfileCategorySelection): ProfileCategorySelection => ({
  ...selection,
  categoryIds: [...selection.categoryIds],
  subcategoryIds: [...selection.subcategoryIds],
})

export function hydrateCategorySelection(
  profile: ProfileCategoryRecord
): ProfileCategorySelection {
  const savedCategoryIds = uniqueIds(profile.category_ids)
  const savedSubcategoryIds = uniqueIds(profile.subcategory_ids)
  const categoryIds = savedCategoryIds.length > 0
    ? savedCategoryIds
    : uniqueIds(profile.category_id ? [profile.category_id] : [])
  const subcategoryIds = savedSubcategoryIds.length > 0
    ? savedSubcategoryIds
    : uniqueIds(profile.subcategory_id ? [profile.subcategory_id] : [])
  const requestedPrimaryCategoryId = profile.primary_category_id ?? profile.category_id
  const requestedPrimarySubcategoryId = profile.primary_subcategory_id ?? profile.subcategory_id

  return {
    categoryIds,
    subcategoryIds,
    primaryCategoryId: requestedPrimaryCategoryId && categoryIds.includes(requestedPrimaryCategoryId)
      ? requestedPrimaryCategoryId
      : categoryIds[0] ?? null,
    primarySubcategoryId: requestedPrimarySubcategoryId && subcategoryIds.includes(requestedPrimarySubcategoryId)
      ? requestedPrimarySubcategoryId
      : null,
  }
}

export function toggleCategory(
  selection: ProfileCategorySelection,
  categoryId: string,
  checked: boolean,
  subcategoryCategoryById: SubcategoryCategoryMap
): ProfileCategorySelection {
  const categoryIds = checked
    ? uniqueIds([...selection.categoryIds, categoryId])
    : selection.categoryIds.filter((id) => id !== categoryId)
  const subcategoryIds = checked
    ? [...selection.subcategoryIds]
    : selection.subcategoryIds.filter((id) => subcategoryCategoryById[id] !== categoryId)
  const primaryCategoryId = selection.primaryCategoryId && categoryIds.includes(selection.primaryCategoryId)
    ? selection.primaryCategoryId
    : checked
      ? categoryId
      : categoryIds[0] ?? null
  const primarySubcategoryId = selection.primarySubcategoryId
    && subcategoryIds.includes(selection.primarySubcategoryId)
    && categoryIds.includes(subcategoryCategoryById[selection.primarySubcategoryId] ?? '')
    ? selection.primarySubcategoryId
    : null

  return { categoryIds, subcategoryIds, primaryCategoryId, primarySubcategoryId }
}

export function toggleSubcategory(
  selection: ProfileCategorySelection,
  subcategoryId: string,
  checked: boolean,
  subcategoryCategoryById: SubcategoryCategoryMap
): ProfileCategorySelection {
  const parentCategoryId = subcategoryCategoryById[subcategoryId]
  if (!parentCategoryId || !selection.categoryIds.includes(parentCategoryId)) {
    return copySelection(selection)
  }

  const subcategoryIds = checked
    ? uniqueIds([...selection.subcategoryIds, subcategoryId])
    : selection.subcategoryIds.filter((id) => id !== subcategoryId)
  const primarySubcategoryId = selection.primarySubcategoryId === subcategoryId
    ? null
    : selection.primarySubcategoryId && subcategoryIds.includes(selection.primarySubcategoryId)
      ? selection.primarySubcategoryId
      : null

  return { ...selection, subcategoryIds, primarySubcategoryId }
}

export function selectPrimaryCategory(
  selection: ProfileCategorySelection,
  categoryId: string,
  subcategoryCategoryById: SubcategoryCategoryMap
): ProfileCategorySelection {
  if (!selection.categoryIds.includes(categoryId)) return copySelection(selection)

  const primarySubcategoryId = selection.primarySubcategoryId
    && selection.subcategoryIds.includes(selection.primarySubcategoryId)
    && subcategoryCategoryById[selection.primarySubcategoryId] === categoryId
    ? selection.primarySubcategoryId
    : null

  return { ...selection, primaryCategoryId: categoryId, primarySubcategoryId }
}

export function selectPrimarySubcategory(
  selection: ProfileCategorySelection,
  subcategoryId: string,
  subcategoryCategoryById: SubcategoryCategoryMap
): ProfileCategorySelection {
  const parentCategoryId = subcategoryCategoryById[subcategoryId]
  if (
    !selection.subcategoryIds.includes(subcategoryId)
    || !parentCategoryId
    || parentCategoryId !== selection.primaryCategoryId
    || !selection.categoryIds.includes(parentCategoryId)
  ) {
    return copySelection(selection)
  }

  return { ...selection, primarySubcategoryId: subcategoryId }
}
