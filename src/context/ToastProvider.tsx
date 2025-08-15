import React, { createContext, useContext, useMemo, useState } from 'react'

export type Toast = {
  id: string
  title?: string
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  durationMs?: number
}

type Ctx = {
  addToast: (t: Omit<Toast, 'id'>) => void
}

const ToastCtx = createContext<Ctx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = ({ title, message, type = 'info', durationMs = 2500 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, title, message, type, durationMs }
    setToasts(prev => [...prev, toast])
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, durationMs)
  }

  const value = useMemo(() => ({ addToast }), [])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`min-w-[240px] max-w-[360px] rounded-lg shadow-lg border px-4 py-3 bg-white dark:bg-gray-900 dark:border-gray-800 ${
              t.type === 'success' ? 'border-emerald-300/60' :
              t.type === 'error' ? 'border-red-300/60' :
              t.type === 'warning' ? 'border-amber-300/60' : 'border-slate-200'
            }`}>
            {t.title && <div className="text-sm font-semibold mb-0.5">{t.title}</div>}
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
