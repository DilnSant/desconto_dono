'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Lock, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function AtualizarSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasValidSession, setHasValidSession] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        // Verifica se há código PKCE na URL para troca por sessão
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const code = urlParams.get('code')
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            if (!exchangeError && mounted) {
              setHasValidSession(true)
            }
          }
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          if (session) {
            setHasValidSession(true)
          }
          setSessionChecked(true)
        }
      } catch {
        if (mounted) setSessionChecked(true)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasValidSession(true)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(
          updateError.message ||
            'Não foi possível atualizar a senha. O link pode ter expirado.'
        )
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch {
      setError('Ocorreu um erro ao atualizar a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-gray-800/95 border border-gray-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Header / Logo */}
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center border-2 border-yellow-400 shadow-[0_0_15px_rgba(254,223,0,0.3)]"
            style={{ background: 'radial-gradient(circle, #009B3A 0%, #005C2D 100%)' }}
          >
            <span className="text-yellow-400 text-lg font-black leading-none">DD</span>
          </div>
          <h1 className="text-2xl font-black text-white">Criar Nova Senha</h1>
          <p className="text-gray-400 text-sm mt-1">
            Digite e confirme sua nova senha para recuperar o acesso
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-green-950/60 border border-green-700/60 text-green-300 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white mb-1">Senha atualizada com sucesso!</p>
                <p className="text-green-200/90 text-xs leading-relaxed">
                  Sua nova senha foi salva. Você será redirecionado para a página de login em instantes...
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 shadow-md"
              style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}
            >
              Ir para o Login agora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!hasValidSession && sessionChecked && (
              <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-700/50 text-yellow-300 text-xs leading-relaxed">
                Atenção: certifique-se de acessar esta página pelo link recebido em seu e-mail de recuperação.
              </div>
            )}

            <div>
              <label htmlFor="nova-senha" className="block text-sm font-semibold text-gray-200 mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  id="nova-senha"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-700 bg-gray-900/80 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmar-senha" className="block text-sm font-semibold text-gray-200 mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  id="confirmar-senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-700 bg-gray-900/80 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-atualizar-senha-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 shadow-md mt-2"
              style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Atualizando senha...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </button>

            <div className="text-center pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar para o Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

