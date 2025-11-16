"use client"

import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

let toasts: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

const addToast = (message: string, type: ToastType = 'info', duration: number = 4000) => {
  const id = `toast-${Date.now()}-${Math.random()}`
  const toast: Toast = { id, message, type, duration }

  toasts = [...toasts, toast]
  listeners.forEach(listener => listener(toasts))

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
}

const removeToast = (id: string) => {
  toasts = toasts.filter(t => t.id !== id)
  listeners.forEach(listener => listener(toasts))
}

export const toast = {
  success: (message: string, duration?: number) => addToast(message, 'success', duration),
  error: (message: string, duration?: number) => addToast(message, 'error', duration),
  info: (message: string, duration?: number) => addToast(message, 'info', duration)
}

export function ToastContainer() {
  const [activeToasts, setActiveToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    listeners.push(setActiveToasts)
    return () => {
      listeners = listeners.filter(l => l !== setActiveToasts)
    }
  }, [])

  if (!mounted || typeof window === 'undefined') return null

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-br from-green-50 to-green-100/90 border-green-200 text-green-900'
      case 'error':
        return 'bg-gradient-to-br from-red-50 to-red-100/90 border-red-200 text-red-900'
      case 'info':
        return 'bg-gradient-to-br from-blue-50 to-blue-100/90 border-blue-200 text-blue-900'
    }
  }

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
    }
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none">
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-center gap-3
            rounded-2xl border shadow-lg
            px-4 py-3 min-w-[320px] max-w-md
            animate-in slide-in-from-right-full duration-300
            ${getToastStyles(toast.type)}
          `}
        >
          {getIcon(toast.type)}
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
