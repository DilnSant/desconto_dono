/**
 * Formata um valor monetário em Real Brasileiro (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata uma data para exibição em pt-BR
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Formata data relativa (ex: "há 2 dias")
 */
export function formatRelativeDate(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `há ${minutes} min`
  if (hours < 24) return `há ${hours}h`
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  return formatDate(date)
}

/**
 * Formata número de WhatsApp para link de contato
 */
export function formatWhatsAppLink(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const br = cleaned.startsWith('55') ? cleaned : `55${cleaned}`
  const msg = message ? encodeURIComponent(message) : ''
  return `https://wa.me/${br}${msg ? `?text=${msg}` : ''}`
}

/**
 * Trunca texto com reticências
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Gera iniciais para avatar
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

/**
 * Valida e-mail
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Formata número de telefone BR
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

/**
 * Cria URL de imagem pública do Supabase Storage
 */
export function getStorageUrl(bucket: string, path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || !path) return ''
  return `${url}/storage/v1/object/public/${bucket}/${path}`
}

/**
 * Converte arquivo para Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })
}

/**
 * Classe condicional (cn utility)
 */
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ')
}
