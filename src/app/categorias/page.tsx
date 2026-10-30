import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CATEGORIES_STATIC, CATEGORY_COLOR_MAP } from '@/lib/constants/categories'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

export const metadata: Metadata = {
  title: 'Categorias — Desconto do Dono',
  description: 'Explore todas as 14 categorias de negócios locais e serviços disponíveis na plataforma Desconto do Dono.',
}

function getIcon(iconName: string, className?: string) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
  if (!Icon) return null
  return <Icon className={className} />
}

export default function CategoriasPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-3">Todas as Categorias</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Explore <strong>14 categorias</strong> com dezenas de subcategorias para encontrar exatamente o que precisa
        </p>
      </div>

      {/* Grid de categorias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATEGORIES_STATIC.map((cat) => {
          const colors = CATEGORY_COLOR_MAP[cat.color]
          return (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              id={`cat-page-${cat.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Banner colorido */}
              <div className={cn('h-2 w-full', colors.bg)} />

              <div className="p-5">
                {/* Ícone */}
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform', colors.bg)}>
                  {cat.icon && getIcon(cat.icon, 'w-6 h-6 text-white')}
                </div>

                {/* Nome */}
                <h2 className={cn('font-black text-lg text-gray-900 mb-1 group-hover:transition-colors', `group-hover:${colors.text}`)}>
                  {cat.name}
                </h2>

                {/* Subcategorias */}
                <p className="text-gray-400 text-sm mb-3">
                  {cat.subcategories.length} subcategoria{cat.subcategories.length !== 1 ? 's' : ''}
                </p>

                {/* Lista de subcategorias */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {cat.subcategories.slice(0, 3).map((sub) => (
                    <span key={sub.id} className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colors.badge)}>
                      {sub.name}
                    </span>
                  ))}
                  {cat.subcategories.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                      +{cat.subcategories.length - 3}
                    </span>
                  )}
                </div>

                {/* CTA */}
                <div className={cn('flex items-center gap-1 text-sm font-semibold transition-colors', colors.text)}>
                  Ver anúncios <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
