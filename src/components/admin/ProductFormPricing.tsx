import { Info } from 'lucide-react'
import type { ProductFormData } from '../../hooks/useProductForm'

interface ProductFormPricingProps {
  form: ProductFormData
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void
  getFieldClass: (field: string, extra?: string) => string
  labelClass: string
}

export function ProductFormPricing({ form, updateField, getFieldClass, labelClass }: ProductFormPricingProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Pricing</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Regular Price *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">$</span>
            <input
              type="number"
              value={form.regularPrice}
              onChange={(e) => updateField('regularPrice', e.target.value)}
              placeholder="0.00"
              className={`${getFieldClass('regularPrice')} pl-8 font-mono`}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Sale Price</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">$</span>
            <input
              type="number"
              value={form.salePrice}
              onChange={(e) => updateField('salePrice', e.target.value)}
              placeholder="0.00"
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
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AED">AED (د.إ)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.makeOfferEnabled}
            onChange={(e) => updateField('makeOfferEnabled', e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent-gold)]"
          />
          <span className="text-xs font-bold text-[var(--text-secondary)]">Enable Make Offer</span>
        </label>
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
