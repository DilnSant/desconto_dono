import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface UnreadCountState {
  userId: string
  count: number | null
}

export function getCurrentUnreadCount(
  state: UnreadCountState | null,
  userId: string | undefined
): number | null {
  if (!userId || !state || state.userId !== userId) return null
  return state.count
}

export async function getUnreadCount(
  client: SupabaseClient<Database>,
  userId: string
): Promise<number | null> {
  try {
    const { count, error } = await client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('[HEADER UNREAD COUNT]', error)
      return null
    }

    return count ?? 0
  } catch (error) {
    console.error('[HEADER UNREAD COUNT]', error)
    return null
  }
}
