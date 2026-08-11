import { useRef } from 'react'
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react'

interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

interface AdminImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (file: File) => Promise<void>
  importing: boolean
  importResult: ImportResult | null
}

export function AdminImportModal({ open, onClose, onImport, importing, importResult }: AdminImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => { if (!importing) onClose() }}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
            Import Products from CSV
          </h2>
          <button
            onClick={() => { if (!importing) onClose() }}
            disabled={importing}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors disabled:opacity-30"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!importResult ? (
            <>
              <div className="rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center">
                <Upload size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  Upload a CSV file with columns:
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                  name, sku, brand, category, condition, availability, regularPrice, salePrice, stockCount, status
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-import-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onImport(f)
                  }}
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={importing}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 text-xs font-bold text-[var(--btn-blue-text)] hover:brightness-95 transition-colors disabled:opacity-50"
                >
                  {importing ? (
                    <><Loader2 size={12} className="animate-spin" /> Importing...</>
                  ) : (
                    <><Upload size={12} /> Choose CSV File</>
                  )}
                </button>
              </div>
              <p className="text-[0.625rem] text-[var(--text-muted)] text-center">
                Max 500 rows. Products with duplicate SKUs are skipped.
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle size={40} className="mx-auto text-[var(--success)] mb-3" />
              <p className="text-sm font-bold text-[var(--text-primary)]">Import Complete</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Created: {importResult.created} · Skipped: {importResult.skipped}
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-3 rounded-lg bg-[var(--surface-soft)] p-3 text-left max-h-40 overflow-y-auto">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-[0.625rem] text-[var(--danger)]">{err}</p>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
