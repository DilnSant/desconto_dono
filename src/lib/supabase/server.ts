import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorado em Server Components
          }
        },
      },
    }
  )
}

/**
 * Versão sem tipagem estrita — use quando queries parciais geram inferência 'never'.
 * Mantém cookies/auth idênticos ao createSupabaseServerClient.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createSupabaseServerDb(): Promise<any> {
  return createSupabaseServerClient()
}
