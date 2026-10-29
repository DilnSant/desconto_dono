'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const TOAST_STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
}

const TOAST_ICON_STYLES = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
}

export function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)
  const Icon = TOAST_ICONS[type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg max-w-sm transition-all duration-300',
      TOAST_STYLES[type],
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    )}>
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', TOAST_ICON_STYLES[type])} />
      <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
        className="text-current opacity-60 hover:opacity-100 transition-opacity shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Hook para usar toasts
import { createContext, useContext, useCallback, useRef } from 'react'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Container de toasts */}
      <div className="fixed bottom-24 md:bottom-6 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
