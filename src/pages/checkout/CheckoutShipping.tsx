import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'
import { countries } from '../../data/countries'

interface Shipping {
  fullName: string
  email: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface CheckoutShippingProps {
  shipping: Shipping
  errors: Record<string, boolean>
  updateShipping: (field: string, value: string) => void
  goToStep: (step: number) => void
  isGuest?: boolean
}

export function CheckoutShipping({ shipping, errors, updateShipping, goToStep, isGuest }: CheckoutShippingProps) {
  const { t } = useTranslation()

  const inputClass = (field: string) =>
    `w-full px-4 py-3 bg-[var(--input-bg)] border text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[var(--accent-primary)] transition-all rounded-xl ${
      errors[field] ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--input-border)]'
    }`

  // Reusable field wrapper with label, error message, and aria attributes
  const Field = ({ field, label, required, children }: { field: string; label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="mb-1">
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
        {label} {required && <span className="text-[var(--danger)]">*</span>}
      </label>
      {children}
      {errors[field] && (
        <p className="mt-1 text-[11px] text-[var(--danger)]" role="alert">
          {field === 'email' ? 'Please enter a valid email address' : 'This field is required'}
        </p>
      )}
    </div>
  )

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] p-5 sm:p-8">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <MapPin size={18} className="text-[var(--accent-primary)]" /> {t('checkout.stepShipping')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field field="fullName" label={t('checkout.fullName')} required>
          <input
            type="text"
            value={shipping.fullName}
            onChange={(e) => updateShipping('fullName', e.target.value)}
            className={inputClass('fullName')}
            placeholder={t('checkout.placeholders.fullName')}
            autoComplete="name"
            inputMode="text"
            aria-invalid={errors.fullName || undefined}
          />
        </Field>

        {isGuest && (
          <Field field="email" label="Email Address" required>
            <input
              type="email"
              value={shipping.email}
              onChange={(e) => updateShipping('email', e.target.value)}
              className={inputClass('email')}
              placeholder="you@company.com"
              autoComplete="email"
              inputMode="email"
              aria-invalid={errors.email || undefined}
            />
          </Field>
        )}

        <Field field="addressLine1" label={t('checkout.addressLine1')} required>
          <input
            type="text"
            value={shipping.addressLine1}
            onChange={(e) => updateShipping('addressLine1', e.target.value)}
            className={inputClass('addressLine1')}
            placeholder={t('checkout.placeholders.addressLine1')}
            autoComplete="address-line1"
            inputMode="text"
            aria-invalid={errors.addressLine1 || undefined}
          />
        </Field>

        <Field field="addressLine2" label={t('checkout.addressLine2')}>
          <input
            type="text"
            value={shipping.addressLine2}
            onChange={(e) => updateShipping('addressLine2', e.target.value)}
            className={inputClass('addressLine2')}
            placeholder={t('checkout.placeholders.addressLine2')}
            autoComplete="address-line2"
            inputMode="text"
          />
        </Field>

        <Field field="city" label={t('checkout.city')} required>
          <input
            type="text"
            value={shipping.city}
            onChange={(e) => updateShipping('city', e.target.value)}
            className={inputClass('city')}
            placeholder={t('checkout.placeholders.city')}
            autoComplete="address-level2"
            inputMode="text"
            aria-invalid={errors.city || undefined}
          />
        </Field>

        <Field field="state" label={t('checkout.state')} required>
          <input
            type="text"
            value={shipping.state}
            onChange={(e) => updateShipping('state', e.target.value)}
            className={inputClass('state')}
            placeholder={t('checkout.placeholders.state')}
            autoComplete="address-level1"
            inputMode="text"
            aria-invalid={errors.state || undefined}
          />
        </Field>

        <Field field="postalCode" label={t('checkout.postalCode')} required>
          <input
            type="text"
            value={shipping.postalCode}
            onChange={(e) => updateShipping('postalCode', e.target.value)}
            className={inputClass('postalCode')}
            placeholder={t('checkout.placeholders.postalCode')}
            autoComplete="postal-code"
            inputMode="numeric"
            aria-invalid={errors.postalCode || undefined}
          />
        </Field>

        <Field field="country" label={t('checkout.country')} required>
          <select
            value={shipping.country}
            onChange={(e) => updateShipping('country', e.target.value)}
            className={inputClass('country')}
            autoComplete="country"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394A3B8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              appearance: 'none',
            }}
          >
            {countries.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
      </div>
      <button
        type="button"
        onClick={() => goToStep(2)}
        className="w-full flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--accent-primary)] text-[var(--btn-blue-text)] font-semibold text-sm border border-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all mt-6 rounded-xl cursor-pointer"
      >
        {t('checkout.continuePayment')}
      </button>
    </div>
  )
}
