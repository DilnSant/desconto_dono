'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { CATEGORIES_STATIC, CATEGORY_COLOR_MAP } from '@/lib/constants/categories'
import type { CategoryWithSubs } from '@/types/database'
import { cn } from '@/lib/utils/helpers'

interface CategoryGridProps {
  categories?: CategoryWithSubs[]
  compact?: boolean
}

function getIcon(iconName: string, className?: string) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
  if (!Icon) return null
  return <Icon className={className} />
}

function CategoryCard({ category }: { category: CategoryWithSubs }) {
  const [expanded, setExpanded] = useState(false)
  const colors = CATEGORY_COLOR_MAP[category.color] || CATEGORY_COLOR_MAP['neutral']

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300 overflow-hidden group',
        expanded
          ? `${colors.border} shadow-md`
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      )}
    >
      {/* Cabeçalho da categoria */}
      <button
        id={`category-${category.slug}`}
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5 transition-colors duration-200',
          expanded ? colors.light : 'bg-white hover:bg-gray-50'
        )}
      >
        {/* Ícone */}
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
          colors.bg
        )}>
          {category.icon && getIcon(category.icon, 'w-4 h-4 text-white')}
        </div>

        {/* Nome */}
        <span className={cn(
          'flex-1 text-left font-semibold text-sm',
          expanded ? colors.text : 'text-gray-800'
        )}>
          {category.name}
        </span>

        {/* Contador + Seta */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            expanded ? colors.badge : 'bg-gray-100 text-gray-500'
          )}>
            {category.subcategories.length}
          </span>
          <span className={cn(
            'transition-transform duration-300',
            expanded ? colors.text : 'text-gray-400'
          )}>
            {expanded
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />
            }
          </span>
        </div>
      </button>

      {/* Subcategorias expandíveis */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className={cn('px-3 pb-3 pt-1', colors.light)}>
          <div className="flex flex-wrap gap-2">
            {category.subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/categoria/${category.slug}/${sub.slug}`}
                id={`subcategory-${sub.slug}`}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm',
                  colors.badge
                )}
              >
                {sub.name}
              </Link>
            ))}
          </div>
          <Link
            href={`/categoria/${category.slug}`}
            className={cn(
              'mt-3 inline-flex items-center gap-1 text-xs font-semibold transition-colors',
              colors.text
            )}
          >
            Ver todos em {category.name} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CategoryGrid({ categories, compact }: CategoryGridProps) {
  const cats = categories || CATEGORIES_STATIC

  return (
    <section id="category-grid" className="w-full">
      <div className={cn(
        'grid gap-3',
        compact
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      )}>
        {cats.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  )
}
