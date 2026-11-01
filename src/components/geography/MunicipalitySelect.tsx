'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, MapPin, RefreshCw } from 'lucide-react'
import type { Municipality } from '@/lib/geography/municipalities'

interface MunicipalitySelectProps {
  id: string
  label: string
  value: Municipality | null
  onChange: (municipality: Municipality | null) => void
  legacyLocation?: {
    city: string
    state: string
  }
  required?: boolean
}

interface MunicipalityResponse {
  municipalities: Municipality[]
}

function isMunicipalityResponse(value: unknown): value is MunicipalityResponse {
  if (typeof value !== 'object' || value === null || !('municipalities' in value)) {
    return false
  }

  const municipalities = value.municipalities
  return (
    Array.isArray(municipalities) &&
    municipalities.every(
      (municipality) =>
        typeof municipality === 'object' &&
        municipality !== null &&
        'ibgeCode' in municipality &&
        typeof municipality.ibgeCode === 'string' &&
        'name' in municipality &&
        typeof municipality.name === 'string' &&
        'stateCode' in municipality &&
        typeof municipality.stateCode === 'string',
    )
  )
}

function formatMunicipality(municipality: Municipality): string {
  return `${municipality.name} - ${municipality.stateCode}`
}

export default function MunicipalitySelect({
  id,
  label,
  value,
  onChange,
  legacyLocation,
  required = false,
}: MunicipalitySelectProps) {
  const [query, setQuery] = useState('')
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (value || query.trim().length < 2) return

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/municipios?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        })
        const payload: unknown = await response.json()
        if (!response.ok || !isMunicipalityResponse(payload)) {
          throw new Error('Resposta inválida ao buscar municípios')
        }

        setMunicipalities(payload.municipalities)
        setError('')
        setIsOpen(true)
      } catch {
        if (!controller.signal.aborted) {
          setMunicipalities([])
          setError('Não foi possível carregar os municípios. Verifique sua conexão e tente novamente.')
          setIsOpen(false)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [query, retryCount, value])

  const inputValue = value ? formatMunicipality(value) : query
  const legacyCity = legacyLocation?.city.trim()
  const legacyState = legacyLocation?.state.trim()

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
        {label}{required ? ' *' : ''}
      </label>
      <div className="relative">
        <MapPin
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        />
        <input
          id={id}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
          autoComplete="off"
          required={required}
          value={inputValue}
          onChange={(event) => {
            setQuery(event.target.value)
            setMunicipalities([])
            setError('')
            setLoading(false)
            setIsOpen(false)
            if (value) onChange(null)
          }}
          onFocus={() => {
            if (municipalities.length > 0) setIsOpen(true)
          }}
          placeholder="Digite o nome da cidade"
          className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
        {loading && (
          <Loader2
            aria-label="Buscando municípios"
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-green-600"
          />
        )}
      </div>

      {legacyCity && legacyState && !value && (
        <p className="text-xs text-gray-500">
          Localização cadastrada: {legacyCity}, {legacyState}. Ela será mantida até você selecionar
          um município oficial.
        </p>
      )}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="flex items-start gap-2">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="inline-flex shrink-0 items-center gap-1 font-semibold underline"
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Tentar novamente
          </button>
        </div>
      )}

      {isOpen && (
        <ul
          id={`${id}-options`}
          role="listbox"
          className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {municipalities.length > 0 ? (
            municipalities.map((municipality) => (
              <li key={municipality.ibgeCode}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value?.ibgeCode === municipality.ibgeCode}
                  onClick={() => {
                    setQuery(formatMunicipality(municipality))
                    setMunicipalities([])
                    setIsOpen(false)
                    onChange(municipality)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 focus:bg-green-50 focus:outline-none"
                >
                  {municipality.name}, {municipality.stateCode}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-gray-500">
              Nenhum município encontrado. Selecione um resultado oficial.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
