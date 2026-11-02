'use client'

import { useState } from 'react'
import { MapPin, X } from 'lucide-react'
import MunicipalitySelect from '@/components/geography/MunicipalitySelect'
import { getPlanEntitlements, type PlanType } from '@/lib/plans/entitlements'
import type { CoverageSelection } from '@/lib/profiles/coverage'
import type { Municipality } from '@/lib/geography/municipalities'

interface ServiceCoverageEditorProps {
  plan: PlanType
  value: CoverageSelection
  onChange: (selection: CoverageSelection) => void
  legacyLocation?: { city: string; state: string }
}

function municipalityLabel(municipality: Municipality): string {
  return `${municipality.name} - ${municipality.stateCode}`
}

export default function ServiceCoverageEditor({
  plan,
  value,
  onChange,
  legacyLocation,
}: ServiceCoverageEditorProps) {
  const entitlements = getPlanEntitlements(plan)
  const [pendingMunicipality, setPendingMunicipality] = useState<Municipality | null>(null)
  const [error, setError] = useState('')

  const selectMunicipality = (municipality: Municipality | null) => {
    setPendingMunicipality(municipality)
    if (!municipality) {
      setError('')
      return
    }

    if (value.scope !== 'municipalities') return
    if (value.municipalities.some((item) => item.ibgeCode === municipality.ibgeCode)) {
      setError('Esse município já foi adicionado.')
      setPendingMunicipality(null)
      return
    }
    if (value.municipalities.length >= entitlements.maxMunicipalities) {
      setError(`Seu plano permite até ${entitlements.maxMunicipalities} município(s).`)
      setPendingMunicipality(null)
      return
    }

    onChange({ scope: 'municipalities', municipalities: [...value.municipalities, municipality] })
    setPendingMunicipality(null)
    setError('')
  }

  return (
    <fieldset className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <legend className="px-1 text-lg font-black text-gray-800">Área de atuação</legend>
      <p className="text-sm text-gray-500">
        O plano {plan} permite {entitlements.allowsNationalCoverage
          ? `até ${entitlements.maxMunicipalities} municípios ou atuação nacional`
          : `${entitlements.maxMunicipalities} município`}.
      </p>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="service-coverage-scope"
            checked={value.scope === 'municipalities'}
            onChange={() =>
              onChange({ scope: 'municipalities', municipalities: [] })
            }
          />
          Municípios
        </label>
        <label className={`flex items-center gap-2 ${!entitlements.allowsNationalCoverage ? 'text-gray-400' : ''}`}>
          <input
            type="radio"
            name="service-coverage-scope"
            checked={value.scope === 'national'}
            disabled={!entitlements.allowsNationalCoverage}
            onChange={() => onChange({ scope: 'national', declaredNonPresential: false })}
          />
          Atuação nacional
        </label>
      </div>

      {value.scope === 'municipalities' ? (
        <div className="space-y-3">
          {value.municipalities.map((municipality) => (
            <div key={municipality.ibgeCode} className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-green-900">
                <MapPin aria-hidden="true" className="h-4 w-4" />
                {municipalityLabel(municipality)}
              </span>
              <button
                type="button"
                aria-label={`Remover ${municipalityLabel(municipality)}`}
                onClick={() =>
                  onChange({
                    scope: 'municipalities',
                    municipalities: value.municipalities.filter(
                      (item) => item.ibgeCode !== municipality.ibgeCode,
                    ),
                  })
                }
                className="rounded p-1 text-gray-500 hover:bg-green-100"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
          {value.municipalities.length < entitlements.maxMunicipalities && (
            <MunicipalitySelect
              id="service-area-municipality"
              label="Adicionar município"
              value={pendingMunicipality}
              onChange={selectMunicipality}
              legacyLocation={legacyLocation}
            />
          )}
        </div>
      ) : (
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={value.declaredNonPresential}
            onChange={(event) =>
              onChange({
                scope: 'national',
                declaredNonPresential: event.target.checked,
              })
            }
          />
          <span>
            Declaro que o atendimento pode ser realizado sem presença física no local do cliente
            (por meio digital ou remoto).
          </span>
        </label>
      )}

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </fieldset>
  )
}
