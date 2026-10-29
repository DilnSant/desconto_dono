import { createSupabaseServerDb } from '@/lib/supabase/server'

/**
 * Retorna o cliente Supabase server-side sem inferência estrita de tipos.
 * Use para queries select/insert/update que retornam 'never' sem tipagem genérica.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerDb(): Promise<any> {
  return createSupabaseServerDb()
}
