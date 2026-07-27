import type { ProductFormData } from '../../hooks/useProductForm'

interface ProductFormSeoProps {
  form: ProductFormData
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void
  getFieldClass: (field: string, extra?: string) => string
  labelClass: string
}

export function ProductFormSeo({ form, updateField, getFieldClass, labelClass }: ProductFormSeoProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">SEO & Search</h2>

      <div>
        <label className={labelClass}>Meta Title</label>
        <input
          type="text"
          value={form.seoTitle}
          onChange={(e) => updateField('seoTitle', e.target.value)}
          placeholder="SEO title (auto-filled from product name)"
          className={getFieldClass('seoTitle')}
        />
        <p className="mt-1 text-[0.625rem] text-[var(--text-muted)]">
          {form.seoTitle.length}/60 characters · {form.seoTitle.length > 60 ? 'Too long' : 'Good'}
        </p>
      </div>

      <div>
        <label className={labelClass}>Meta Description</label>
        <textarea
          value={form.seoDescription}
          onChange={(e) => updateField('seoDescription', e.target.value)}
          placeholder="SEO description for search results"
          rows={3}
          className={`${getFieldClass('seoDescription')} resize-y`}
        />
        <p className="mt-1 text-[0.625rem] text-[var(--text-muted)]">
          {form.seoDescription.length}/160 characters · {form.seoDescription.length > 160 ? 'Too long' : 'Good'}
        </p>
      </div>

      <div>
        <label className={labelClass}>Search Keywords</label>
        <textarea
          value={form.searchKeywords}
          onChange={(e) => updateField('searchKeywords', e.target.value)}
          placeholder="Additional search keywords, part numbers, alternate names (comma-separated)"
          rows={2}
          className={`${getFieldClass('searchKeywords')} resize-y`}
        />
      </div>
    </div>
  )
}
