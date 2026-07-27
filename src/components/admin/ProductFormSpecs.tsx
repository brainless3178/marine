import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { ProductFormData, SpecRow } from '../../hooks/useProductForm'

interface ProductFormSpecsProps {
  form: ProductFormData
  addSpec: () => void
  removeSpec: (i: number) => void
  updateSpec: (i: number, field: keyof SpecRow, value: string) => void
  getFieldClass: (field: string, extra?: string) => string
}

export function ProductFormSpecs({ form, addSpec, removeSpec, updateSpec, getFieldClass }: ProductFormSpecsProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Technical Specifications</h2>
        <button
          onClick={addSpec}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"
        >
          <Plus size={12} /> Add Row
        </button>
      </div>

      {form.specs.map((spec, i) => (
        <div key={i} className="flex items-center gap-3">
          <GripVertical size={14} className="text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            value={spec.name}
            onChange={(e) => updateSpec(i, 'name', e.target.value)}
            placeholder="Specification name"
            className={`${getFieldClass('')} flex-1`}
          />
          <input
            type="text"
            value={spec.value}
            onChange={(e) => updateSpec(i, 'value', e.target.value)}
            placeholder="Value"
            className={`${getFieldClass('')} flex-1`}
          />
          {form.specs.length > 1 && (
            <button
              onClick={() => removeSpec(i)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-danger/5 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}

      {form.specs.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">
          No specifications added yet. Click &quot;Add Row&quot; to start.
        </p>
      )}
    </div>
  )
}
