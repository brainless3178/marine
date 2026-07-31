import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Check, X, Truck } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useStoreSettings } from '../../hooks/useStoreSettings'

interface CheckoutSuccessProps {
  subtotal: number
  cancelSubmitted: boolean
  cancelReason: string
  setCancelReason: (reason: string) => void
  setCancelSubmitted: (submitted: boolean) => void
  handleContinueShopping: () => void
}

export function CheckoutSuccess({
  subtotal,
  cancelSubmitted,
  cancelReason,
  setCancelReason,
  setCancelSubmitted,
  handleContinueShopping,
}: CheckoutSuccessProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { orderId, setCancelRequested } = useStore()
  const settings = useStoreSettings()
  const shippingCost = settings.shippingCost
  const tax = Math.round(subtotal * settings.taxRate * 100) / 100
  const total = subtotal + shippingCost + tax

  return (
    <div className="py-24">
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 text-center">
        <div className="w-20 h-20 mx-auto relative mb-6">
          <div className="w-20 h-20 rounded-full border-[3px] border-[var(--success)]" />
          <div
            className="absolute top-6 left-[30px] w-4 h-9 border-r-[3px] border-b-[3px] border-[var(--success)]"
            style={{ transform: 'rotate(45deg)' }}
          />
        </div>
        <h2 className="heading-xl mb-2">{t('checkout.orderPlaced')}</h2>
        <p className="font-mono text-lg text-[var(--accent-gold)] mb-2">Order #{orderId}</p>
        <p className="text-sm text-[var(--text-secondary)] max-w-[480px] mx-auto">
          {t('checkout.orderConfirmation')} <strong className="text-[var(--accent-primary)]">{t('checkout.estimatedDelivery')}</strong>.
        </p>

        <div className="mt-8 bg-[var(--surface)] border border-[var(--border)] p-6 text-left">
          <h3 className="text-sm font-semibold mb-4">{t('checkout.orderSummary')}</h3>
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
            <span>{t('checkout.subtotal')}</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
            <span>{t('checkout.shipping')}</span><span>${shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
            <span>{t('checkout.tax')}</span><span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-[var(--text-primary)] pt-3 mt-3 border-t border-[var(--border)]">
            <span>{t('checkout.grandTotal')}</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Cancel Request Section */}
        {cancelSubmitted ? (
          <div className="mt-8 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-left">
            <div className="flex items-center gap-2 text-[var(--success)] mb-2">
              <Check size={16} />
              <span className="text-sm font-semibold">{t('checkout.cancelSuccess')}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {t('checkout.cancelSuccessDesc')}
            </p>
          </div>
        ) : (
          <div className="mt-8 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-left">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <X size={14} className="text-[var(--danger)]" /> {t('checkout.cancelHeading')}
            </h4>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('checkout.cancelPlaceholder')}
              className="w-full px-4 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] rounded-lg focus:border-[var(--accent-primary)] min-h-[80px] mb-3"
            />
            <button
              onClick={() => {
                if (!cancelReason.trim()) return
                setCancelSubmitted(true)
                setCancelRequested(true)
              }}
              disabled={!cancelReason.trim()}
              className="w-full py-3 bg-[var(--accent-gold)] text-navy-deep font-bold text-xs rounded-xl hover:bg-[var(--gold-light)] transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('checkout.cancelSubmitBtn')}
            </button>
          </div>
        )}

        <div className="flex gap-4 flex-wrap justify-center mt-4">
          <button
            onClick={handleContinueShopping}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--accent-primary)] text-[var(--btn-blue-text)] font-semibold text-sm border border-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all rounded-xl cursor-pointer"
          >
            {t('checkout.continueShopping')}
          </button>
          <button onClick={() => navigate('/products')} className="inline-flex items-center gap-2 text-xs font-semibold border border-[var(--accent-primary)] text-[var(--accent-primary)] px-[18px] py-[10px] hover:bg-[var(--accent-primary)]/10 transition-all cursor-pointer rounded-xl">
            <Truck size={14} /> {t('checkout.trackOrder')}
          </button>
        </div>
      </div>
    </div>
  )
}
