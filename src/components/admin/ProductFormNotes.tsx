import { Info } from 'lucide-react'
import type { ProductFormData } from '../../hooks/useProductForm'

interface ProductFormNotesProps {
  form: ProductFormData
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void
  getFieldClass: (field: string, extra?: string) => string
  labelClass: string
}

export function ProductFormNotes({ form, updateField, getFieldClass, labelClass }: ProductFormNotesProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Admin Notes</h2>

      <div>
        <label className={labelClass}>Internal Notes</label>
        <textarea
          value={form.internalNotes}
          onChange={(e) => updateField('internalNotes', e.target.value)}
          placeholder="Private notes for the team — not visible to customers"
          rows={6}
          className={`${getFieldClass('internalNotes')} resize-y`}
        />
      </div>

      <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] p-4">
        <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
          <Info size={14} />
          Admin notes are only visible to staff with Inventory Manager or Owner roles.
        </p>
      </div>
    </div>
  )
}
