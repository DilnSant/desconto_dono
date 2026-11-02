'use client'

import { useState } from 'react'
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
}

export default function CompanyDirectoryFilters({
  categories,
  initialIbgeCode = '',
  initialStateCode = '',
  initialMunicipalityName = '',
  initialCategoryId = '',
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
      className="grid gap-4 rounded-2xl border border-[#dce8df] bg-white p-5 md:grid-cols-[minmax(0,1.5fr)_minmax(9rem,0.7fr)_minmax(12rem,1fr)_auto] md:items-end"
    >
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
      </div>

      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#005c2d] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#004822] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005c2d]"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Buscar empresas
      </button>
    </form>
  )
}
