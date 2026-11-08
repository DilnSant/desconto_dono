import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (typeof window !== 'undefined' ? '' : 'https://placeholder.supabase.co')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof window !== 'undefined' ? '' : 'placeholder')

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('ERRO CRÍTICO: Variáveis do Supabase não configuradas no cliente.')
}

/**
 * Cliente Supabase para Browser (Client Components).
 * Utiliza @supabase/ssr createBrowserClient para garantir que a sessão
 * de autenticação e os tokens PKCE sejam gravados em cookies, permitindo
 * que Server Components e Middleware reconheçam o usuário logado.
 *
 * Durante o build na Vercel (onde as variáveis podem estar ausentes),
 * utiliza valores placeholder para evitar erros de avaliação de módulo.
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
