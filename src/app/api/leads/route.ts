import { NextResponse } from 'next/server'
import { createLead } from '@/lib/leads/create-lead'
import { sendLeadNotification } from '@/lib/email/resend'
import { getServerDb } from '@/lib/supabase/server-db'

export async function POST(request: Request) {
  let input: unknown
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const result = await createLead(input, {
    createId: () => crypto.randomUUID(),
    findActiveBenefit: async (offerId) => {
      const supabase = await getServerDb()
      const { data, error } = await supabase
        .from('benefits')
        .select('id,title,author_id')
        .eq('id', offerId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      if (!data) return null
      return {
        id: data.id,
        title: data.title,
        authorId: data.author_id,
      }
    },
    findPublicEmail: async (authorId) => {
      const supabase = await getServerDb()
      const { data, error } = await supabase
        .from('profiles_public')
        .select('email_public')
        .eq('id', authorId)
        .maybeSingle()

      if (error) throw error
      return data?.email_public ?? null
    },
    insertLead: async ({ id, offerId, clientName, clientWhatsapp }) => {
      const supabase = await getServerDb()
      const { error } = await supabase.from('leads').insert({
        id,
        offer_id: offerId,
        client_name: clientName,
        client_whatsapp: clientWhatsapp,
      })

      if (error) throw error
    },
    sendNotification: sendLeadNotification,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result, { status: 201 })
}
