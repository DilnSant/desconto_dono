'use client'

import { ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react'
import { getPlanEntitlements, type PlanType } from '@/lib/plans/entitlements'
import type { ProfileSegmentSelection } from '@/lib/profiles/coverage'
import type { CategoryOption } from '@/lib/categories/catalog'

interface ProfileSegmentsEditorProps {
  categories: CategoryOption[]
  loading: boolean
  catalogError: string
  plan: PlanType
  value: ProfileSegmentSelection
  onChange: (selection: ProfileSegmentSelection) => void
}

export default function ProfileSegmentsEditor({
  categories,
  loading,
  catalogError,
  plan,
  value,
  onChange,
}: ProfileSegmentsEditorProps) {
  const entitlements = getPlanEntitlements(plan)
  const selectedSubcategoryCount = value.segments.reduce(
    (count, segment) => count + segment.subcategoryIds.length,
    0,
  )

  const updateSegment = (
    index: number,
    update: (segment: ProfileSegmentSelection['segments'][number]) => ProfileSegmentSelection['segments'][number],
  ) => {
    onChange({
      segments: value.segments.map((segment, segmentIndex) =>
        segmentIndex === index ? update(segment) : segment,
      ),
    })
  }

  const addSegment = () => {
    const selectedCategoryIds = new Set(value.segments.map((segment) => segment.categoryId))
    const nextCategory = categories.find((category) => !selectedCategoryIds.has(category.id))
    if (!nextCategory || value.segments.length >= entitlements.maxSegments) return

    onChange({
      segments: [
        ...value.segments,
        {
          categoryId: nextCategory.id,
          subcategoryIds: [],
          isPrimary: value.segments.length === 0,
        },
      ],
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Seu plano permite {entitlements.maxSegments} segmento(s) e {entitlements.maxSubcategories}{' '}
        subcategoria(s).
      </p>
      {loading && (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Carregando categorias...
        </p>
      )}
      {catalogError && <p role="alert" className="text-sm text-red-700">{catalogError}</p>}

      {value.segments.map((segment, index) => {
        const selectedCategory = categories.find((category) => category.id === segment.categoryId)
        const selectedOnOtherSegments = new Set(
          value.segments
            .filter((_, segmentIndex) => segmentIndex !== index)
            .map((item) => item.categoryId),
        )

        return (
          <fieldset key={`${segment.categoryId}-${index}`} className="space-y-3 rounded-xl border border-gray-200 p-4">
            <legend className="sr-only">Segmento {index + 1}</legend>
            <div className="flex items-center gap-2">
              <label htmlFor={`profile-category-${index}`} className="sr-only">Categoria do segmento {index + 1}</label>
              <div className="relative min-w-0 flex-1">
                <select
                  id={`profile-category-${index}`}
                  value={segment.categoryId}
                  onChange={(event) => {
                    const categoryId = event.target.value
                    updateSegment(index, () => ({ ...segment, categoryId, subcategoryIds: [] }))
                  }}
                  disabled={loading || Boolean(catalogError)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-8 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id} disabled={selectedOnOtherSegments.has(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="radio"
                  name="primary-profile-segment"
                  checked={segment.isPrimary}
                  onChange={() =>
                    onChange({
                      segments: value.segments.map((item, segmentIndex) => ({
                        ...item,
                        isPrimary: segmentIndex === index,
                      })),
                    })
                  }
                />
                Principal
              </label>
              <button
                type="button"
                aria-label={`Remover segmento ${index + 1}`}
                onClick={() => {
                  const segments = value.segments.filter((_, segmentIndex) => segmentIndex !== index)
                  if (segments.length > 0 && !segments.some((item) => item.isPrimary)) {
                    segments[0] = { ...segments[0], isPrimary: true }
                  }
                  onChange({ segments })
                }}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedCategory.subcategories.map((subcategory) => {
                  const checked = segment.subcategoryIds.includes(subcategory.id)
                  const limitReached = selectedSubcategoryCount >= entitlements.maxSubcategories
                  return (
                    <label key={subcategory.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && limitReached}
                        onChange={(event) => {
                          const subcategoryIds = event.target.checked
                            ? [...segment.subcategoryIds, subcategory.id]
                            : segment.subcategoryIds.filter((id) => id !== subcategory.id)
                          updateSegment(index, () => ({ ...segment, subcategoryIds }))
                        }}
                      />
                      {subcategory.name}
                    </label>
                  )
                })}
              </div>
            )}
          </fieldset>
        )
      })}

      <button
        type="button"
        onClick={addSegment}
        disabled={
          loading ||
          Boolean(catalogError) ||
          value.segments.length >= entitlements.maxSegments ||
          value.segments.length >= categories.length
        }
        className="inline-flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus aria-hidden="true" className="h-4 w-4" /> Adicionar segmento
      </button>
    </div>
  )
}
