import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import LoginForm from '@/components/auth/LoginForm'




export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Entrar — Desconto do Dono',
  description: 'Acesse sua conta Desconto do Dono e descubra ofertas exclusivas e negócios locais.',
}



export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { erro, detalhes } = await searchParams
  const errorCode = Array.isArray(erro) ? erro[0] : erro
  const errorDetails = Array.isArray(detalhes) ? detalhes[0] : detalhes
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/')

  return (
    <div className="min-h-[calc(100vh-80px)] flex">
      {/* Painel esquerdo — decorativo */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #005C2D 0%, #009B3A 50%, #002776 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10" style={{ background: '#FEDF00' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5" style={{ background: '#FEDF00' }} />
        </div>
        <div className="relative text-center px-8 max-w-sm">
          <Image
            src="/images/LogoTransp..png"
            alt="Desconto do Dono"
            width={1024}
            height={572}
            className="w-40 h-auto mx-auto mb-6 object-contain"
          />
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Bem-vindo ao<br />
            <span style={{ color: '#FEDF00' }}>Desconto do Dono</span>
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            O clube de descontos e negócios locais conectando você às melhores empresas.
          </p>
          <div className="mt-8 rounded-2xl bg-white/10 border border-white/20 p-5 text-left">
            <p className="text-yellow-300 font-bold mb-2">Sua rede começa com uma conversa.</p>
            <p className="text-white/70 text-sm leading-relaxed">
              Acesse seu perfil, encontre negócios e continue suas conversas na plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 lg:max-w-[520px] flex items-center justify-center px-4 py-12 bg-gray-50">
        <LoginForm
          initialError={
            errorCode === 'oauth'
              ? errorDetails
                ? `Falha ao autenticar com Google: ${errorDetails}`
                : 'Falha ao autenticar com Google. Tente novamente.'
              : ''
          }
        />
      </div>
    </div>
  )
}
