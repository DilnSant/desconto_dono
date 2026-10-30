'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://www.descontododono.com.br/atualizar-senha',
      })

      if (resetError) {
        console.error('Erro resetPasswordForEmail:', resetError)
        setError(resetError.message || 'Erro ao enviar e-mail de recuperação. Tente novamente.')
      } else {
        setSuccess(true)
      }
    } catch (err: unknown) {
      console.error('Exceção ao solicitar recuperação:', err)
      const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-gray-800/95 border border-gray-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Header / Logo */}
        <div className="text-center mb-6">
          <Image
            src="/images/LogoTransp..png"
            alt="Desconto do Dono"
            width={1024}
            height={572}
            className="h-12 w-auto mx-auto mb-3 object-contain"
          />
          <h1 className="text-2xl font-black text-white">Recuperar Senha</h1>
          <p className="text-gray-400 text-sm mt-1">
            Informe seu e-mail para receber as instruções de redefinição
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-green-950/60 border border-green-700/60 text-green-300 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white mb-1">E-mail enviado com sucesso!</p>
                <p className="text-green-200/90 text-xs leading-relaxed">
                  Enviamos o link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e a pasta de spam.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="w-full py-3 rounded-xl border border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-gray-200 font-semibold text-sm transition-all"
              >
                Enviar para outro e-mail
              </button>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 shadow-md"
                style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}
              >
                <ArrowLeft className="w-4 h-4" /> Voltar para o Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-sm">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-red-200 text-xs mb-0.5">Erro ao solicitar recuperação</p>
                  <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="recuperar-email" className="block text-sm font-semibold text-gray-200 mb-1.5">
                E-mail cadastrado
              </label>
              <div className="relative">
                <input
                  id="recuperar-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-700 bg-gray-900/80 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              id="btn-recuperar-senha-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 shadow-md mt-2"
              style={{ background: 'linear-gradient(135deg, #009B3A, #005C2D)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando link...
                </>
              ) : (
                'Enviar link de recuperação'
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
