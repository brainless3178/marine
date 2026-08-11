import { useState, useEffect } from 'react'
import { X, BadgePercent, Tag, Star, Sparkles, Loader2, CheckCircle, Info } from 'lucide-react'
import { toLocalInputValue, currencyPrefix } from '../../lib/utils'
import { validateOfferInput } from './offerValidation'
import type { ApiProduct } from '../../lib/api-types'

interface ProductOfferModalProps {
  open: boolean
  product: ApiProduct | null
  saving: boolean
  onClose: () => void
  onSave: (data: {
    salePrice: number | null
    saleStartsAt: string | null
    saleEndsAt: string | null
    makeOfferEnabled: boolean
    minimumOfferPrice: number | null
    isFeatured: boolean
    isNewArrival: boolean
    customLabel: string | null
    customLabelColor: string | null
  }) => void
}

const LABEL_COLORS = ['#159a67', '#c45200', '#1668d4', '#cf2020', '#7b6337', '#6d28d9', '#0e7490']

export function ProductOfferModal({ open, product, saving, onClose, onSave }: ProductOfferModalProps) {
  const [saleOn, setSaleOn] = useState(false)
  const [salePrice, setSalePrice] = useState('')
  const [saleStartsAt, setSaleStartsAt] = useState('')
  const [saleEndsAt, setSaleEndsAt] = useState('')
  const [makeOfferEnabled, setMakeOfferEnabled] = useState(false)
  const [minimumOfferPrice, setMinimumOfferPrice] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isNewArrival, setIsNewArrival] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customLabelColor, setCustomLabelColor] = useState(LABEL_COLORS[0])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !product) return
    setSaleOn(!!product.salePrice && Number(product.salePrice) > 0)
    setSalePrice(product.salePrice ? String(product.salePrice) : '')
    setSaleStartsAt(toLocalInputValue(product.saleStartsAt))
    setSaleEndsAt(toLocalInputValue(product.saleEndsAt))
    setMakeOfferEnabled(product.makeOfferEnabled ?? product.makeOffer ?? false)
    setMinimumOfferPrice(product.minimumOfferPrice ? String(product.minimumOfferPrice) : '')
    setIsFeatured(product.isFeatured ?? false)
    setIsNewArrival(product.isNewArrival ?? false)
    setCustomLabel(product.customLabel || '')
    setCustomLabelColor(product.customLabelColor || LABEL_COLORS[0])
    setError('')
  }, [open, product])

  if (!open || !product) return null

  const regular = Number(product.regularPrice) || 0
  const saleVal = Number(salePrice) || 0
  const offPct = saleOn && regular > 0 && saleVal > 0 ? Math.round((1 - saleVal / regular) * 100) : 0

  const handleSave = () => {
    setError('')
    const result = validateOfferInput({
      saleOn,
      salePrice,
      regularPrice: regular,
      saleStartsAt,
      saleEndsAt,
      makeOfferEnabled,
      minimumOfferPrice,
    })
    if (result.error) {
      setError(result.error)
      return
    }
    onSave({
      salePrice: result.salePrice,
      saleStartsAt: result.saleStartsAt,
      saleEndsAt: result.saleEndsAt,
      makeOfferEnabled,
      minimumOfferPrice: result.minimumOfferPrice,
      isFeatured,
      isNewArrival,
      customLabel: customLabel.trim() || null,
      customLabelColor: customLabel.trim() ? customLabelColor : null,
    })
  }

  const inputCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--accent-gold)]'
  const labelCls = 'mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)]'
  const prefix = currencyPrefix(product.currency || 'USD')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold-muted)] text-[var(--accent-gold)]">
              <BadgePercent size={16} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-[var(--text-primary)]">Run Offer</h3>
              <p className="text-xs text-[var(--text-muted)] truncate max-w-[280px]">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* ── Sale section ── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <label className="flex items-center gap-2.5 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={saleOn}
                onChange={(e) => setSaleOn(e.target.checked)}
                className="h-4 w-4 rounded accent-[var(--accent-gold)]"
              />
              <span className="text-sm font-bold text-[var(--text-primary)]">Put on Sale</span>
              {offPct > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-[0.625rem] font-bold text-[var(--success)]">
                  {offPct}% OFF
                </span>
              )}
            </label>

            <div className={`grid grid-cols-2 gap-3 ${saleOn ? '' : 'pointer-events-none opacity-40'}`}>
              <div>
                <label className={labelCls}>Sale Price ({product.currency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">{prefix}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0.00"
                    aria-label="Sale price"
                    className={`${inputCls} pl-8 font-mono`}
                  />
                </div>
              </div>
              <div className="flex items-end pb-1">
                <p className="text-xs text-[var(--text-muted)]">
                  {offPct > 0 ? (
                    <>
                      Regular: <span className="font-mono font-bold line-through opacity-70">{prefix}{regular.toFixed(2)}</span>
                      <span className="ml-1 font-mono font-bold text-[var(--success)]">{prefix}{saleVal.toFixed(2)}</span>
                    </>
                  ) : (
                    <>Regular: <span className="font-mono font-bold text-[var(--text-primary)]">{prefix}{regular.toFixed(2)}</span></>
                  )}
                </p>
              </div>
              <div>
                <label className={labelCls}>Starts</label>
                <input type="datetime-local" value={saleStartsAt} onChange={(e) => setSaleStartsAt(e.target.value)} aria-label="Sale starts" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ends</label>
                <input type="datetime-local" value={saleEndsAt} onChange={(e) => setSaleEndsAt(e.target.value)} aria-label="Sale ends" className={inputCls} />
              </div>
            </div>
            <p className="mt-2 text-[0.625rem] text-[var(--text-muted)] flex items-center gap-1.5">
              <Info size={11} /> Leave dates empty for an unlimited sale. Customers see the sale price only inside this window.
            </p>
          </div>

          {/* ── Make offer section ── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={makeOfferEnabled}
                onChange={(e) => setMakeOfferEnabled(e.target.checked)}
                className="h-4 w-4 rounded accent-[var(--accent-gold)]"
              />
              <span className="text-sm font-bold text-[var(--text-primary)]">Accept Customer Offers</span>
              <span className="ml-auto text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Make Offer button</span>
            </label>
            <div className={`mt-3 ${makeOfferEnabled ? '' : 'pointer-events-none opacity-40'}`}>
              <label className={labelCls}>Minimum Offer Price (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">{prefix}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minimumOfferPrice}
                  onChange={(e) => setMinimumOfferPrice(e.target.value)}
                  placeholder="No minimum"
                  aria-label="Minimum offer price"
                  className={`${inputCls} pl-8 font-mono`}
                />
              </div>
            </div>
          </div>

          {/* ── Promotion flags ── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Promotion Flags</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 rounded accent-[var(--accent-gold)]" />
                <Star size={13} className="text-[var(--accent-gold)]" />
                <span className="text-xs font-bold text-[var(--text-secondary)]">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} className="h-4 w-4 rounded accent-[var(--accent-gold)]" />
                <Sparkles size={13} className="text-[var(--accent-blue)]" />
                <span className="text-xs font-bold text-[var(--text-secondary)]">New Arrival</span>
              </label>
            </div>
          </div>

          {/* ── Custom label ── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <label className={labelCls}><Tag size={11} className="inline mr-1" /> Custom Badge Label (optional)</label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Hot Deal, Clearance, Only 3 Left"
              className={inputCls}
            />
            {customLabel.trim() && (
              <>
                <div className="mt-3 flex items-center gap-2">
                  {LABEL_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCustomLabelColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${customLabelColor === c ? 'scale-110 border-[var(--text-primary)]' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Badge color ${c}`}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-[0.625rem] font-bold text-white"
                    style={{ backgroundColor: customLabelColor }}
                  >
                    {customLabel}
                  </span>
                  <span className="text-[0.625rem] text-[var(--text-muted)]">Preview</span>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2.5 text-xs font-semibold text-[var(--admin-badge-danger-text)]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4">
          <button onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-gold)] px-5 py-2.5 text-xs font-extrabold text-[var(--btn-blue-text)] transition-all hover:brightness-95 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {saving ? 'Saving...' : 'Apply Offer'}
          </button>
        </div>
      </div>
    </div>
  )
}
