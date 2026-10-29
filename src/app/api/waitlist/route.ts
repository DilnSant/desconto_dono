import { NextResponse } from 'next/server'
import { getServerDb } from '@/lib/supabase/server-db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { full_name, email, city, state, category_id, has_company, accepted_terms } = body

    // Validação básica
    if (!full_name || !email || !city || !state) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }
    if (!accepted_terms) {
      return NextResponse.json({ error: 'Aceite os termos para continuar' }, { status: 400 })
    }

    const supabase = await getServerDb()

    // Verificar se e-mail já existe
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id, city')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Este e-mail já está cadastrado na lista de ${existing.city}` },
        { status: 409 }
      )
    }

    // Inserir na lista de espera
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        category_id: category_id || null,
        has_company: !!has_company,
        accepted_terms: true,
      })
      .select('id')
      .single()

    if (error) throw error

    // Calcular posição na fila da cidade
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('city', city.trim())
      .eq('state', state.trim().toUpperCase())

    return NextResponse.json({
      success: true,
      id: data.id,
      position: count ?? 1,
      city,
    })
  } catch (err: unknown) {
    console.error('[WAITLIST API]', err)
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}

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
