import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { sendWaitlistConfirmation } from '@/lib/email/waitlist-confirmation'
import { validateWaitlistPayload } from '@/lib/waitlist/validation'
import { getServerDb } from '@/lib/supabase/server-db'

const logWaitlistFailure = (stage: string, error: unknown) => {
  const details: { code?: string; name?: string } = {}

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code
    if (typeof code === 'string') details.code = code
  }
  if (error instanceof Error) details.name = error.name

  console.error(`[WAITLIST API] ${stage}`, details)
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da solicitação inválido.' }, { status: 400 })
  }

  const validation = validateWaitlistPayload(body)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  let supabase
  try {
    supabase = await getServerDb()
  } catch (error) {
    logWaitlistFailure('Could not initialize database client', error)
    return NextResponse.json(
      { error: 'Não foi possível concluir o cadastro. Tente novamente.' },
      { status: 500 }
    )
  }

  const { full_name, email, city, state, category_id, has_company, accepted_terms } =
    validation.value
  const id = randomUUID()

  let insertError: unknown
  try {
    const { error } = await supabase.from('waitlist').insert({
      id,
      full_name,
      email,
      city,
      state,
      category_id,
      has_company,
      accepted_terms,
    })
    insertError = error
  } catch (error) {
    logWaitlistFailure('Database insert failed', error)
    return NextResponse.json(
      { error: 'Não foi possível concluir o cadastro. Tente novamente.' },
      { status: 500 }
    )
  }

  if (insertError) {
    if (
      typeof insertError === 'object'
      && insertError !== null
      && 'code' in insertError
      && insertError.code === '23505'
    ) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado na lista de espera.' },
        { status: 409 }
      )
    }

    logWaitlistFailure('Database insert failed', insertError)
    return NextResponse.json(
      { error: 'Não foi possível concluir o cadastro. Tente novamente.' },
      { status: 500 }
    )
  }

  let position: number | null = null
  let rankingFailed = false
  try {
    const { data, error } = await supabase
      .from('cities_ranking')
      .select('total')
      .eq('city', city)
      .eq('state', state)
      .maybeSingle()

    if (error) {
      logWaitlistFailure('Could not query city ranking', error)
      rankingFailed = true
    } else if (typeof data?.total === 'number') {
      position = data.total
    } else {
      rankingFailed = true
    }
  } catch (error) {
    logWaitlistFailure('Could not query city ranking', error)
    rankingFailed = true
  }

  let emailSent = false
  try {
    const confirmation = await sendWaitlistConfirmation({
      id,
      fullName: full_name,
      email,
      city,
      state,
    })
    emailSent = confirmation.sent
    if (!confirmation.sent) {
      console.error('[WAITLIST API] Confirmation email was not sent', {
        reason: confirmation.error,
      })
    }
  } catch (error) {
    logWaitlistFailure('Confirmation email failed', error)
  }

  const notice = rankingFailed
    ? 'Não foi possível calcular sua posição na fila agora.'
    : undefined

  return NextResponse.json(
    {
      success: true,
      id,
      position,
      emailSent,
      ...(notice ? { notice } : {}),
    },
    { status: 201 }
  )
}

export async function GET() {
  try {
    const supabase = await getServerDb()
    const { data, error } = await supabase
      .from('cities_ranking')
      .select('city, state, total, companies_count')
      .limit(20)

    if (error) {
      logWaitlistFailure('Could not load city ranking', error)
      return NextResponse.json(
        { error: 'Não foi possível carregar o ranking agora.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ranking: data })
  } catch (error) {
    logWaitlistFailure('Could not load city ranking', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar o ranking agora.' },
      { status: 500 }
    )
  }
}
