import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rotas que requerem autenticação. O editor de perfil é /perfil; /perfil/{id}
// é a página pública da empresa e não deve herdar essa proteção.
const PROTECTED_ROUTES = ['/mensagens', '/anuncio/novo']

function isProtectedRoute(pathname: string) {
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/'
  return normalizedPathname === '/perfil' || PROTECTED_ROUTES.some(
    (route) => normalizedPathname === route || normalizedPathname.startsWith(`${route}/`),
  )
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Redirecionar para login se rota protegida e sem auth
  const isProtected = isProtectedRoute(pathname)
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
