import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type AddRelationships<Items> = {
  [Item in keyof Items]: Items[Item] & { Relationships: [] }
}

type AdminDatabase = {
  public: {
    Tables: AddRelationships<Database['public']['Tables']>
    Views: AddRelationships<Database['public']['Views']>
    Functions: Database['public']['Functions']
    Enums: Database['public']['Enums']
  }
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada.')
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.')

  return createClient<AdminDatabase>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
