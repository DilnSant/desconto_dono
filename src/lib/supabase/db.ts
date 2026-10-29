/**
 * Helper que retorna o cliente Supabase sem tipagem estrita.
 * Usar apenas quando as queries de texto livre causam inferência 'never'.
 * Para queries completas, usar o cliente tipado importado de '@/lib/supabase/client'.
 */
import { supabase as typedClient } from '@/lib/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = typedClient as any

export { typedClient as supabase }
