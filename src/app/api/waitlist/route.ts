import { NextResponse } from 'next/server'
import { getServerDb } from '@/lib/supabase/server-db'
import { sendWaitlistConfirmation } from '@/lib/email/resend'
import { createWaitlistPostHandler } from '@/lib/waitlist/handler'

export const POST = createWaitlistPostHandler({
  createId: () => crypto.randomUUID(),
  insert: async (input) => {
    const supabase = await getServerDb()
    const { error } = await supabase.from('waitlist').insert(input)
    return { errorCode: error?.code }
  },
  getCityPosition: async (city, state) => {
    const supabase = await getServerDb()
    const { data, error } = await supabase
      .from('cities_ranking')
      .select('total')
      .eq('city', city)
      .eq('state', state)
      .maybeSingle()

    if (error) throw error
    return data?.total ?? null
  },
  sendConfirmation: sendWaitlistConfirmation,
})

export async function GET() {
  // Retorna ranking de cidades
  try {
    const supabase = await getServerDb()
    const { data } = await supabase
      .from('cities_ranking')
      .select('city, state, total, companies_count')
      .limit(20)

    return NextResponse.json({ ranking: data || [] })
  } catch {
    return NextResponse.json({ ranking: [] })
  }
}
