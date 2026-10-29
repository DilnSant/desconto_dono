import Link from 'next/link'
import { Shield, Heart } from 'lucide-react'
import SponsorBanner from '@/components/ui/SponsorBanner'

const footerLinks = {
  Plataforma: [
    { label: 'Como Funciona', href: '/como-funciona' },
    { label: 'Categorias', href: '/categorias' },
    { label: 'Anunciar Grátis', href: '/anuncio/novo' },
    { label: 'Empresas Verificadas', href: '/verificacao' },
  ],
  Empresa: [
    { label: 'Sobre Nós', href: '/sobre' },
    { label: 'Blog', href: '/blog' },
    { label: 'Imprensa', href: '/imprensa' },
    { label: 'Contato', href: '/contato' },
  ],
  Legal: [
    { label: 'Termos de Uso', href: '/termos' },
    { label: 'Privacidade', href: '/privacidade' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Segurança', href: '/seguranca' },
  ],
}

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-gray-100 bg-white mt-16">
      {/* Faixa Brasil */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #009B3A 33%, #FEDF00 33%, #FEDF00 66%, #002776 66%)' }} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo e descrição */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
                <span className="text-yellow-400 text-[9px] font-black text-center leading-tight">DD</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-gray-900 text-base leading-tight">Desconto</span>
                <span className="font-black text-green-700 text-sm leading-tight">do Dono</span>
              </div>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Clube de descontos e diretório de empresas para empreendedores brasileiros.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span>Negociações 100% Seguras</span>
            </div>
            {/* Patrocinador no Footer */}
            <SponsorBanner variant="footer" />
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-black text-gray-800 text-sm mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="text-gray-500 text-sm hover:text-green-700 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Desconto do Dono. Todos os direitos reservados.
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-1.5">
            Feito com <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> para empreendedores brasileiros 🇧🇷
          </p>
        </div>
      </div>
    </footer>
  )
}
