'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import MunicipalitySelect from '@/components/geography/MunicipalitySelect'
import type { Municipality } from '@/lib/geography/municipalities'

const STATE_CODES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]

interface CompanyDirectoryFiltersProps {
  categories: Array<{ id: string; name: string }>
  initialIbgeCode?: string
  initialStateCode?: string
  initialMunicipalityName?: string
  initialCategoryId?: string
  catalogError?: string | null
}

export default function CompanyDirectoryFilters({
  categories,
  initialIbgeCode = '',
  initialStateCode = '',
  initialMunicipalityName = '',
  initialCategoryId = '',
  catalogError = null,
}: CompanyDirectoryFiltersProps) {
  const [municipality, setMunicipality] = useState<Municipality | null>(
    initialIbgeCode && initialStateCode
      ? {
          ibgeCode: initialIbgeCode,
          name: initialMunicipalityName || initialIbgeCode,
          stateCode: initialStateCode,
        }
      : null,
  )
  const [stateCode, setStateCode] = useState(initialStateCode)

  return (
    <form
      action="/empresas"
      method="get"
      aria-label="Filtros para empresas"
      className="space-y-5 rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#183323]">Filtros</h2>
        <Link href="/empresas" className="text-xs font-semibold text-[#007a39] hover:underline">
          Limpar
        </Link>
      </div>
      <p className="text-sm leading-6 text-gray-500">Escolha onde e em qual segmento deseja buscar.</p>

      <MunicipalitySelect
        id="directory-municipality"
        label="Município"
        value={municipality}
        onChange={(value) => {
          setMunicipality(value)
          if (value) setStateCode(value.stateCode)
        }}
      />
      <input type="hidden" name="ibgeCode" value={municipality?.ibgeCode ?? ''} />
      <input
        type="hidden"
        name="municipalityName"
        value={municipality?.name ?? ''}
      />

      <div className="space-y-1.5">
        <label htmlFor="directory-state" className="block text-sm font-semibold text-gray-700">
          UF
        </label>
        <select
          id="directory-state"
          name="stateCode"
          value={stateCode}
          onChange={(event) => {
            const nextState = event.target.value
            setStateCode(nextState)
            if (municipality && nextState !== municipality.stateCode) setMunicipality(null)
          }}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
        >
          <option value="">Todas as UFs</option>
          {STATE_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="directory-category" className="block text-sm font-semibold text-gray-700">
          Segmento
        </label>
        <select
          id="directory-category"
          name="categoryId"
          defaultValue={initialCategoryId}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
        >
          <option value="">Todos os segmentos</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        {catalogError && <p role="alert" className="text-xs text-red-700">{catalogError}</p>}
      </div>

      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#005c2d] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#004822] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005c2d]"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Buscar empresas
      </button>
    </form>
  )
}
