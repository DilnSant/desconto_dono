import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import RegisterForm from '@/components/auth/RegisterForm'




export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cadastro — Desconto do Dono',
  description: 'Crie sua conta grátis e conecte seu negócio local a consumidores através de ofertas exclusivas.',
}



export default async function CadastroPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/')

  return (
    <div className="min-h-[calc(100vh-80px)] flex">
      {/* Painel esquerdo — decorativo */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #005C2D 0%, #009B3A 50%, #002776 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: '#FEDF00' }} />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10" style={{ background: '#FEDF00' }} />
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
            Junte-se a<br />
            <span style={{ color: '#FEDF00' }}>12.500+</span> empreendedores
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            Cadastre-se gratuitamente, publique seus serviços e alcance clientes em todo o Brasil.
          </p>
          <div className="space-y-3 text-left">
            {[
              '✅ Perfil verificado com selos de segurança',
              '✅ Chat direto com potenciais clientes',
              '✅ Visibilidade em 14 categorias de negócios',
              '✅ Sem mensalidade — cadastro 100% gratuito',
            ].map((item) => (
              <p key={item} className="text-white/80 text-sm flex items-start gap-2">{item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 lg:max-w-[520px] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
