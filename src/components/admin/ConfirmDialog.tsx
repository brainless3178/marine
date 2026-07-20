import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${danger ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'}`}>
              <AlertTriangle size={16} />
            </div>
            <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">{title}</h3>
          </div>
          <button onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14} /></button>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
          <button onClick={onCancel} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--text-muted)] transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition-all ${danger ? 'bg-[var(--danger)] hover:bg-[var(--danger)]/80' : 'bg-[var(--accent-gold)] text-navy-deep hover:bg-[var(--gold-light)]'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
