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
  const { erro } = await searchParams
  const errorCode = Array.isArray(erro) ? erro[0] : erro
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
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: '12k+', label: 'Usuários' },
              { value: '48k+', label: 'Anúncios' },
              { value: '14', label: 'Categorias' },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-2xl bg-white/10 border border-white/20">
                <p className="text-2xl font-black text-yellow-400">{s.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 lg:max-w-[520px] flex items-center justify-center px-4 py-12 bg-gray-50">
        <LoginForm
          initialError={
            errorCode === 'oauth' ? 'Falha ao autenticar com Google. Tente novamente.' : ''
          }
        />
      </div>
    </div>
  )
}
