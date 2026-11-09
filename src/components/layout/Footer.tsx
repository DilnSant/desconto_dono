import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full bg-gray-950 text-gray-300 border-t border-gray-800/80">
      {/* Faixa decorativa com as cores nacionais */}
      <div
        className="h-1.5 w-full"
        style={{ background: 'linear-gradient(90deg, #009B3A 33%, #FEDF00 33%, #FEDF00 66%, #002776 66%)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-16 xl:grid-cols-[1.65fr_1fr_1fr]">
          {/* Coluna 1 — Sobre */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-6">
              <Link href="/" className="group inline-flex h-12 shrink-0 items-center gap-2.5 xl:flex xl:h-auto xl:self-stretch xl:items-stretch">
                <Image
                  src="/images/LogoTransp..png"
                  alt="Desconto do Dono"
                  width={1024}
                  height={572}
                  className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 xl:block xl:h-full xl:w-auto xl:max-w-none"
                />
              </Link>

              <p className="min-w-0 flex-1 text-sm leading-relaxed text-gray-400">
                Conectamos empreendedores de direita para fortalecer negócios locais e transformar boas parcerias em contratos confiáveis.
                Nossa plataforma aproxima quem produz, gera empregos e movimenta a economia brasileira.
              </p>
            </div>
            <a href="mailto:faleconosco@descontododono.com.br" className="inline-flex text-sm text-yellow-300 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300">
              faleconosco@descontododono.com.br
            </a>

            <div className="flex items-center gap-2 text-xs text-green-400 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
              <span>Ambiente 100% focado no empreendedorismo nacional 🇧🇷</span>
            </div>
          </div>

          {/* Coluna 2 — Links Rápidos */}
          <div>
            <h4 className="text-white font-black text-base uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              Links Rápidos
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <span>Início</span>
                </Link>
              </li>
              <li>
                <Link href="/empresas" className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <span>Explorar Empresas</span>
                </Link>
              </li>
              <li>
                <Link href="/planos" className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <span>Planos</span>
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <span>Termos de Uso</span>
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <span>Política de Privacidade</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3 — Comunidade & Princípios */}
          <div>
            <h4 className="text-white font-black text-base uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Comunidade & Princípios
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Uma rede fundada em integridade, livre iniciativa e apoio mútuo entre quem produz e gera empregos no Brasil.
            </p>
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                Crie seu perfil gratuito e comece a fazer conexões com empreendedores da sua região.
              </p>
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-gray-950 transition-all hover:brightness-110 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
              >
                Criar conta grátis
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-gray-800 bg-gray-950 px-4 py-4">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 text-sm md:grid-cols-[1fr_auto_1fr]">
          <p className="text-center text-xs text-gray-400 md:text-left">
            © {new Date().getFullYear()} Desconto do Dono. Todos os direitos reservados.
          </p>
          <p className="flex items-center justify-center gap-3 text-xs font-semibold text-gray-300 sm:text-sm">
            <span className="shrink-0">Desenvolvido por:</span>
            <a
              href="https://metododevelops.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visite o site da Método Develops"
              className="relative z-10 inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            >
              <Image
                src="/images/logoMetodoDev.png"
                alt="Método Develops"
                width={1535}
                height={1024}
                className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-[1.6] cursor-pointer"
              />
            </a>
          </p>
          <span aria-hidden="true" className="hidden md:block" />
        </div>
      </div>
    </footer>
  )
}
