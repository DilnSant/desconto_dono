import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      {/* Número 404 decorativo */}
      <div className="relative mb-8">
        <p className="text-[120px] font-black leading-none select-none"
          style={{
            background: 'linear-gradient(135deg, #009B3A, #FEDF00, #002776)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🇧🇷</span>
        </div>
      </div>

      <h1 className="text-3xl font-black text-gray-900 mb-3">
        Página não encontrada
      </h1>
      <p className="text-gray-500 text-lg max-w-md mb-8 leading-relaxed">
        Parece que este endereço não existe ou foi movido. Vamos te ajudar a encontrar o que precisa!
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/"
          id="not-found-home"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:brightness-110 hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
          <Home className="w-4 h-4" /> Voltar ao Início
        </Link>
        <Link href="/categorias"
          id="not-found-categories"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-gray-700 font-bold border border-gray-200 hover:bg-gray-50 transition-colors">
          <Search className="w-4 h-4" /> Explorar Categorias
        </Link>
      </div>
    </div>
  )
}
