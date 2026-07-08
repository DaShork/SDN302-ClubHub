import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const ToastCtx = {
  push: null,
}

export function toast(message, { variant = 'info', duration = 2400 } = {}) {
  ToastCtx.push?.({ id: Date.now() + Math.random(), message, variant, duration })
}

export function Toaster() {
  const [items, setItems] = useState([])

  useEffect(() => {
    ToastCtx.push = (toast) => {
      setItems((prev) => [...prev, toast])
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== toast.id))
      }, toast.duration)
    }
    return () => {
      ToastCtx.push = null
    }
  }, [])

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'px-4 py-3 rounded-xl shadow-xl border text-sm animate-fade-in',
            t.variant === 'success' && 'bg-accent-green/20 border-accent-green text-secondary-100',
            t.variant === 'error' && 'bg-red-500/20 border-red-500 text-secondary-100',
            t.variant === 'info' && 'bg-primary-800 border-white/10 text-secondary-100',
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}