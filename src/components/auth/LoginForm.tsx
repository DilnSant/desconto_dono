'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha inválidos.'
          : 'Erro ao fazer login. Tente novamente.'
      )
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}>
          <span className="text-yellow-400 text-xl font-black">O&N</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Bem-vindo de volta!</h1>
        <p className="text-gray-500 text-sm mt-1">Entre na sua conta Ordem & Negócios</p>
      </div>

      {/* Google Login */}
      <button
        id="btn-google-login"
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-all hover:shadow-md mb-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar com Google
      </button>

      {/* Divisor */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">ou e-mail</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Formulário */}
      <form id="login-form" onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Senha
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              id="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="text-right mt-1.5">
            <Link href="/esqueci-senha" className="text-xs text-green-700 hover:underline font-medium">
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <button
          id="btn-login-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
          ) : (
            'Entrar na conta'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Não tem conta?{' '}
        <Link href="/cadastro" className="text-green-700 font-bold hover:underline">
          Cadastre-se grátis
        </Link>
      </p>
    </div>
  )
}
