import { NextResponse } from 'next/server'
import { createSupabaseServerDb } from '@/lib/supabase/server'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createSupabaseServerDb()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const user = data.user
      const pendingSetup = user?.user_metadata?.pending_profile_setup
      if (user && isRecord(pendingSetup)) {
        const serviceAreas = pendingSetup.service_areas
        const segments = pendingSetup.segments
        if (!Array.isArray(serviceAreas) || !Array.isArray(segments)) {
          return NextResponse.redirect(new URL('/perfil?cadastro=pendente', origin))
        }

        const { error: profileError } = await supabase.from('profiles').update({
          business_name: typeof pendingSetup.business_name === 'string' ? pendingSetup.business_name : null,
          whatsapp: typeof pendingSetup.whatsapp === 'string' ? pendingSetup.whatsapp : null,
          website_url: typeof pendingSetup.website_url === 'string' ? pendingSetup.website_url : null,
          instagram_url: typeof pendingSetup.instagram_url === 'string' ? pendingSetup.instagram_url : null,
        }).eq('id', user.id)

        const { error: setupError } = profileError
          ? { error: profileError }
          : await supabase.rpc('save_profile_coverage_with_audiences', {
            p_service_areas: serviceAreas,
            p_segments: segments,
            p_declared_non_presential: pendingSetup.declared_non_presential === true,
            p_service_hours: null,
          })

        if (setupError) {
          console.error('[AUTH CALLBACK] Falha ao salvar dados iniciais do perfil', setupError)
          return NextResponse.redirect(new URL('/perfil?cadastro=pendente', origin))
        }

        const { error: activationError } = await supabase.from('profiles')
          .update({ is_active: true })
          .eq('id', user.id)
        if (activationError) {
          console.error('[AUTH CALLBACK] Falha ao publicar o perfil após confirmar o cadastro', activationError)
          return NextResponse.redirect(new URL('/perfil?cadastro=pendente', origin))
        }

        const { error: metadataError } = await supabase.auth.updateUser({
          data: { pending_profile_setup: null },
        })
        if (metadataError) {
          console.error('[AUTH CALLBACK] Não foi possível limpar os dados temporários do cadastro', metadataError)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirecionar para página de erro em caso de falha
  return NextResponse.redirect(`${origin}/login?erro=oauth`)
}
