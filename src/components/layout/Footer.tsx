import Link from 'next/link'
import { ShieldCheck, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full bg-gray-950 text-gray-300 border-t border-gray-800/80">
      {/* Faixa decorativa com as cores nacionais */}
      <div
        className="h-1.5 w-full"
        style={{ background: 'linear-gradient(90deg, #009B3A 33%, #FEDF00 33%, #FEDF00 66%, #002776 66%)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">
          {/* Coluna 1 — Sobre */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-yellow-400/80 shadow-[0_0_15px_rgba(254,223,0,0.3)] transition-transform group-hover:scale-105"
                style={{ background: 'radial-gradient(circle, #009B3A 0%, #005C2D 100%)' }}
              >
                <span className="text-yellow-400 text-xs font-black tracking-tight">DD</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-white text-lg tracking-tight leading-tight">
                  Desconto
                </span>
                <span className="font-black text-yellow-400 text-sm tracking-wide leading-tight">
                  do Dono
                </span>
              </div>
            </Link>

            <p className="text-gray-400 text-sm leading-relaxed">
              Nossa missão é unir e fortalecer os empreendedores e empresários que movem o Brasil.
              Uma plataforma independente de alta autoridade focada em conexões seguras, negócios locais,
              vídeo marketing e benefícios exclusivos para impulsionar quem faz a economia nacional acontecer.
            </p>

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
                <Link href="/categorias" className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <span>Explorar Empresas</span>
                </Link>
              </li>
              <li>
                <Link href="/beneficios" className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2">
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
                Faça parte da nossa lista de espera e garanta prioridade na abertura da sua cidade.
              </p>
              <Link
                href="/#lista-espera"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-gray-950 transition-all hover:brightness-110 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}
              >
                Garantir Vaga na Lista
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Base do Rodapé (Créditos - Fundo Dourado Escuro/Amarelo) */}
      <div
        className="w-full py-4 px-4 border-t border-yellow-600/40 text-center"
        style={{ background: 'linear-gradient(90deg, #6B4900 0%, #B8860B 50%, #6B4900 100%)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 text-sm text-yellow-100 font-medium">
          <p className="text-yellow-100 text-xs sm:text-sm">
            © {new Date().getFullYear()} Desconto do Dono. Todos os direitos reservados.
          </p>
          <span className="hidden md:inline text-yellow-300/60">•</span>
          <p className="text-xs sm:text-sm text-white font-bold flex items-center justify-center gap-1.5">
            Desenvolvido por Método Develops |{' '}
            <a
              href="https://www.metododevelops.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-200 hover:text-white underline font-extrabold transition-colors inline-flex items-center gap-1"
            >
              www.metododevelops.com.br
              <ExternalLink className="w-3.5 h-3.5 inline" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
