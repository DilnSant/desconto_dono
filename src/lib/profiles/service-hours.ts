export const SERVICE_HOUR_DAYS = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const

export type ServiceDayKey = (typeof SERVICE_HOUR_DAYS)[number]['key']

export interface ServiceHoursDay {
  open: string
  close: string
  closed: boolean
  allDay?: boolean
}

export type ServiceHoursForm = Record<ServiceDayKey, ServiceHoursDay>

export interface PublicServiceHour {
  key: ServiceDayKey
  label: string
  open: string | null
  close: string | null
  closed: boolean
  allDay?: boolean
}

export function createEmptyServiceHours(): ServiceHoursForm {
  return Object.fromEntries(
    SERVICE_HOUR_DAYS.map(({ key }) => [key, { open: '', close: '', closed: false }]),
  ) as ServiceHoursForm
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function hydrateServiceHours(value: unknown): ServiceHoursForm {
  const empty = createEmptyServiceHours()
  if (!isRecord(value)) return empty

  for (const { key } of SERVICE_HOUR_DAYS) {
    const day = value[key]
    if (!isRecord(day)) continue
    const is24h = day.allDay === true || (day.open === '00:00' && (day.close === '23:59' || day.close === '24:00'))
    empty[key] = {
      open: typeof day.open === 'string' ? day.open : '',
      close: typeof day.close === 'string' ? day.close : '',
      closed: day.closed === true,
      ...(is24h ? { allDay: true } : {}),
    }
  }

  return empty
}

export function validateServiceHours(hours: ServiceHoursForm): string | null {
  for (const { key, label } of SERVICE_HOUR_DAYS) {
    const day = hours[key]
    if (day.closed || day.allDay || (!day.open && !day.close)) continue
    if (!day.open || !day.close) {
      return `Informe o horário de abertura e fechamento de ${label}, ou marque esse dia como fechado ou 24 horas.`
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(day.open) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.close)) {
      return `Confira os horários de ${label}.`
    }
    if (day.close <= day.open) {
      return `O fechamento de ${label} precisa ser depois da abertura.`
    }
  }
  return null
}

export function serializeServiceHours(hours: ServiceHoursForm): Record<string, unknown> {
  return Object.fromEntries(
    SERVICE_HOUR_DAYS.flatMap(({ key }) => {
      const day = hours[key]
      if (day.closed) return [[key, { closed: true }]]
      if (day.allDay) return [[key, { allDay: true, open: '00:00', close: '23:59', closed: false }]]
      if (day.open && day.close) return [[key, { open: day.open, close: day.close, closed: false }]]
      return []
    }),
  )
}

export function getPublicServiceHours(value: unknown): PublicServiceHour[] {
  if (!isRecord(value)) return []

  const entries: PublicServiceHour[] = []
  for (const { key, label } of SERVICE_HOUR_DAYS) {
    const day = value[key]
    if (!isRecord(day)) continue
    if (day.closed === true) {
      entries.push({ key, label, open: null, close: null, closed: true })
      continue
    }
    if (day.allDay === true || (day.open === '00:00' && (day.close === '23:59' || day.close === '24:00'))) {
      entries.push({ key, label, open: '00:00', close: '23:59', closed: false, allDay: true })
      continue
    }
    if (typeof day.open === 'string' && typeof day.close === 'string') {
      entries.push({ key, label, open: day.open, close: day.close, closed: false })
    }
  }
  return entries
}
