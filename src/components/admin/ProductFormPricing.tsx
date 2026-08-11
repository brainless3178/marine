import { Info, CalendarRange, HandCoins } from 'lucide-react'
import { isSaleWindowValid, currencyPrefix } from '../../lib/utils'
import type { ProductFormData } from '../../hooks/useProductForm'

interface ProductFormPricingProps {
  form: ProductFormData
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void
  getFieldClass: (field: string, extra?: string) => string
  labelClass: string
}

export function ProductFormPricing({ form, updateField, getFieldClass, labelClass }: ProductFormPricingProps) {
  const saleOn = !!form.salePrice && Number(form.salePrice) > 0
  const dateError = saleOn && !isSaleWindowValid(form.saleStartsAt, form.saleEndsAt)
  const prefix = currencyPrefix(form.currency)
  const minOfferError = form.makeOfferEnabled && form.minimumOfferPrice && Number(form.minimumOfferPrice) <= 0

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Pricing</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Regular Price <span className="normal-case font-semibold text-[var(--text-muted)]">(optional — hides price if empty)</span></label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">{prefix}</span>
            <input
              type="number"
              value={form.regularPrice}
              onChange={(e) => updateField('regularPrice', e.target.value)}
              placeholder="0.00"
              aria-label="Regular price"
              className={`${getFieldClass('regularPrice')} pl-8 font-mono`}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Sale Price</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">{prefix}</span>
            <input
              type="number"
              value={form.salePrice}
              onChange={(e) => updateField('salePrice', e.target.value)}
              placeholder="0.00"
              aria-label="Sale price"
              className={`${getFieldClass('salePrice')} pl-8 font-mono`}
            />
          </div>
          {form.salePrice && form.regularPrice && Number(form.salePrice) >= Number(form.regularPrice) && (
            <p className="mt-1 text-[0.625rem] font-bold text-[var(--danger)] flex items-center gap-1">
              <Info size={10} /> Sale price must be lower than regular price
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Currency</label>
          <select
            value={form.currency}
            onChange={(e) => updateField('currency', e.target.value)}
            aria-label="Currency"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)]"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AED">AED (د.إ)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </div>
      </div>

      {/* ── Sale window (start/end dates) ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <div className="mb-3 flex items-center gap-2">
          <CalendarRange size={14} className="text-[var(--accent-gold)]" />
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Sale Window</p>
          {!saleOn && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[0.625rem] font-semibold text-[var(--text-muted)]">
              <Info size={10} /> Set a sale price to enable
            </span>
          )}
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${saleOn ? '' : 'pointer-events-none opacity-40'}`} aria-disabled={!saleOn}>
          <div>
            <label className={labelClass}>Sale Starts</label>
            <input
              type="datetime-local"
              value={form.saleStartsAt}
              onChange={(e) => updateField('saleStartsAt', e.target.value)}
              aria-label="Sale starts"
              className={getFieldClass('saleStartsAt')}
            />
          </div>
          <div>
            <label className={labelClass}>Sale Ends</label>
            <input
              type="datetime-local"
              value={form.saleEndsAt}
              onChange={(e) => updateField('saleEndsAt', e.target.value)}
              aria-label="Sale ends"
              className={getFieldClass('saleEndsAt')}
            />
          </div>
        </div>
        {dateError && (
          <p className="mt-2 text-[0.625rem] font-bold text-[var(--danger)] flex items-center gap-1">
            <Info size={10} /> Sale end date must be after the start date
          </p>
        )}
        <p className="mt-2 text-[0.625rem] text-[var(--text-muted)] flex items-center gap-1.5">
          <Info size={11} /> Leave dates empty for an unlimited sale. Customers see the sale price only inside this window.
        </p>
      </div>

      {/* ── Make offer ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.makeOfferEnabled}
              onChange={(e) => updateField('makeOfferEnabled', e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent-gold)]"
            />
            <HandCoins size={14} className="text-[var(--accent-gold)]" />
            <span className="text-xs font-bold text-[var(--text-secondary)]">Enable Make Offer</span>
          </label>
          <div className={`flex-1 min-w-[180px] ${form.makeOfferEnabled ? '' : 'pointer-events-none opacity-40'}`}>
            <label className={labelClass}>Minimum Offer Price (optional)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">{prefix}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minimumOfferPrice}
                onChange={(e) => updateField('minimumOfferPrice', e.target.value)}
                placeholder="No minimum"
                aria-label="Minimum offer price"
                className={`${getFieldClass('minimumOfferPrice')} pl-8 font-mono`}
              />
            </div>
            {minOfferError && (
              <p className="mt-1 text-[0.625rem] font-bold text-[var(--danger)] flex items-center gap-1">
                <Info size={10} /> Minimum offer price must be greater than 0
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] p-4">
        <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
          <Info size={14} />
          Price visibility: Price will be shown on the storefront. To show &quot;Contact for Price&quot; instead, set price to 0.
        </p>
      </div>
    </div>
  )
}
