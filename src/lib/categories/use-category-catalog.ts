'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/supabase/db'
import { parseCategoryCatalog, type CategoryOption } from './catalog'

export function useCategoryCatalog() {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data, error: queryError } = await db
          .from('categories')
          .select('id, name, subcategories(id, category_id, name)')
          .order('name')

        if (queryError) throw queryError
        const catalog = parseCategoryCatalog(data)
        if (!catalog) throw new Error('Invalid category catalog response')
        if (active) setCategories(catalog)
      } catch (loadError) {
        console.error('[CATEGORIAS] Falha ao carregar o catálogo', loadError)
        if (active) {
          setError('Não foi possível carregar as categorias. Atualize a página e tente novamente.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  return { categories, loading, error }
}
