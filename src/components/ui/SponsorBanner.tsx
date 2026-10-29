import { ExternalLink, Zap } from 'lucide-react'

interface SponsorBannerProps {
  variant?: 'feed' | 'footer' | 'bottom-nav'
}

export default function SponsorBanner({ variant = 'feed' }: SponsorBannerProps) {
  if (variant === 'bottom-nav') {
    return (
      <a
        href="https://www.metododevelops.com.br"
        target="_blank"
        rel="noopener noreferrer sponsored"
        id="sponsor-bottom-nav"
        className="flex items-center justify-center gap-1.5 w-full py-1 text-[10px] font-semibold text-white/90 hover:text-white transition-colors"
        style={{ background: 'linear-gradient(90deg, #005C2D, #002776)' }}
      >
        <Zap className="w-3 h-3 text-yellow-400 shrink-0" />
        <span>App ou Site próprio? <strong className="text-yellow-300">Método Develops</strong></span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
      </a>
    )
  }

  if (variant === 'footer') {
    return (
      <a
        href="https://www.metododevelops.com.br"
        target="_blank"
        rel="noopener noreferrer sponsored"
        id="sponsor-footer"
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-yellow-200/50 group hover:border-yellow-300 transition-all"
        style={{ background: 'linear-gradient(135deg, rgba(254,223,0,0.08), rgba(0,92,45,0.05))' }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}>
          <Zap className="w-5 h-5 text-green-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 text-xs font-black leading-tight">
            Impulsione suas vendas com um App ou Site próprio.
          </p>
          <p className="text-green-700 text-xs font-semibold group-hover:underline truncate">
            Conheça a Método Develops →
          </p>
        </div>
        <span className="text-[10px] text-gray-400 shrink-0 bg-gray-100 px-2 py-0.5 rounded-full">Parceiro</span>
      </a>
    )
  }

  // Feed variant (após o 4º card)
  return (
    <a
      href="https://www.metododevelops.com.br"
      target="_blank"
      rel="noopener noreferrer sponsored"
      id="sponsor-feed"
      className="flex items-center gap-4 p-5 rounded-2xl border-2 border-yellow-200 group hover:border-yellow-400 hover:shadow-lg transition-all duration-300 col-span-full"
      style={{ background: 'linear-gradient(135deg, #FFFEF0 0%, #FFFFF8 50%, #F0FDF4 100%)' }}
    >
      {/* Ícone */}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
        style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}>
        <Zap className="w-7 h-7 text-green-900" />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-200 uppercase tracking-wider">
            Parceiro Oficial
          </span>
        </div>
        <p className="text-gray-900 font-black text-sm leading-tight">
          Impulsione suas vendas com um App ou Site próprio.
        </p>
        <p className="text-green-700 text-sm font-semibold mt-0.5 group-hover:underline">
          Conheça a Método Develops <ExternalLink className="w-3 h-3 inline ml-0.5" />
        </p>
      </div>

      {/* CTA */}
      <div className="shrink-0 hidden sm:block">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-green-950 text-sm transition-all group-hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #FEDF00, #FFB800)' }}>
          Saiba mais
        </span>
      </div>
    </a>
  )
}
