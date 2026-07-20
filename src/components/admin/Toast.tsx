import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const config = {
    success: { icon: CheckCircle, bg: 'bg-[var(--success)]', text: 'text-[var(--btn-success-text)]' },
    error: { icon: XCircle, bg: 'bg-[var(--danger)]', text: 'text-[var(--btn-danger-text)]' },
    info: { icon: Info, bg: 'bg-[var(--accent-blue)]', text: 'text-[var(--btn-blue-text)]' },
  }[toast.type]

  const Icon = config.icon

  return (
    <div className={`pointer-events-auto flex items-center gap-3 rounded-xl ${config.bg} ${config.text} px-4 py-3 shadow-lg animate-[slideIn_0.3s_ease] min-w-[280px] max-w-[400px]`}>
      <Icon size={16} className="shrink-0" />
      <span className="text-xs font-bold flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  )
}
