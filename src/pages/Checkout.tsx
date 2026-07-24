import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { Package, CreditCard, ClipboardCheck, ChevronLeft, Truck, Shield, MapPin, Landmark, Loader2, Check, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { storefront } from '../lib/api'
import { getProductImageUrl } from '../lib/utils'
import { useStoreSettings } from '../hooks/useStoreSettings'
import { SEO } from '../components/seo/SEO'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { countries } from '../data/countries'

function PaypalFullLogo() {
  return (
    <div className="flex items-center gap-1.5 inline-flex">
      <svg
        width={14}
        height={16}
        viewBox="0 0 24 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="translate-y-[0.5px]"
      >
        <path
          d="M17.85 7.15C17.39 9.47 15.89 12.67 13.23 13.83c-.81.35-1.73.53-2.65.53H9.7c-.46 0-.84.35-.93.8L7.64 21.6c-.09.46-.5.8-.97.8H2.1c-.55 0-.96-.5-.84-1.04L3.6 6.33c.1-.46.5-.8.97-.8h6.29c1.99 0 3.64.54 4.53 1.7.81 1.07 1.02 2.47.81 3.83l-.65 3.09"
          fill="#003087"
        />
        <path
          d="M13.85 11.15C13.39 13.47 11.89 16.67 9.23 17.83c-.81.35-1.73.53-2.65.53H5.7c-.46 0-.84.35-.93.8L3.64 25.6c-.09.46-.5.8-.97.8H1c-.55 0-.96-.5-.84-1.04L2.5 8.33c.1-.46.5-.8.97-.8h6.29c1.99 0 3.64.54 4.53 1.7.81 1.07 1.02 2.47.81 3.83l-.65 3.09"
          fill="#0079C1"
        />
      </svg>
      <div className="flex items-center font-display font-black italic text-sm tracking-tight leading-none">
        <span className="text-[#003087]">Pay</span>
        <span className="text-[#0079c1]">Pal</span>
      </div>
    </div>
  )
}



export default function Checkout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const stepLabels = [t('checkout.shippingLabel'), t('checkout.paymentLabel'), t('checkout.reviewLabel')]
  const {
    cart, user, getCartTotal, clearCart, getCartCount,
    checkoutStep, setCheckoutStep,
    orderPlaced, setOrderPlaced,
    orderId, generateOrderId,
    setCancelRequested,
    cancelReason, setCancelReason,
  } = useStore()

  const [shipping, setShipping] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
  })
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [cancelSubmitted, setCancelSubmitted] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')

  // Real PayPal states
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [{ isPending: paypalScriptLoading }] = usePayPalScriptReducer()

  // Pre-fill name and email from user
  useEffect(() => {
    if (user) {
      setShipping((prev) => ({ ...prev, fullName: prev.fullName || user.name }))
    }
  }, [user])

  // Redirect if empty cart or not logged in
  useEffect(() => {
    if (!orderPlaced && (cart.length === 0 || !user)) {
      navigate('/products')
    }
  }, [cart.length, user, orderPlaced, navigate])

  const settings = useStoreSettings()
  const subtotal = getCartTotal()
  const shippingCost = settings.shippingCost
  const tax = Math.round(subtotal * settings.taxRate * 100) / 100
  const total = subtotal + shippingCost + tax

  const validateShipping = () => {
    const e: Record<string, boolean> = {}
    if (!shipping.fullName.trim()) e.fullName = true
    if (!shipping.addressLine1.trim()) e.addressLine1 = true
    if (!shipping.city.trim()) e.city = true
    if (!shipping.state.trim()) e.state = true
    if (!shipping.postalCode.trim()) e.postalCode = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Payment validation — no client-side validation needed for PayPal or bank transfer
  const validatePayment = () => true

  const goToStep = (step: number) => {
    if (step > checkoutStep) {
      if (checkoutStep === 1 && !validateShipping()) return
      if (checkoutStep === 2 && !validatePayment()) return
    }
    setCheckoutStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const createStoreOrder = useCallback(async () => {
    try {
      const result = await storefront.orders.create({
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.onSale && item.product.salePrice ? item.product.salePrice : item.product.price,
        })),
        shipping: {
          fullName: shipping.fullName,
          addressLine1: shipping.addressLine1,
          addressLine2: shipping.addressLine2 || undefined,
          city: shipping.city,
          state: shipping.state || undefined,
          postalCode: shipping.postalCode || undefined,
          country: shipping.country,
        },
        paymentMethod,
        subtotal,
        tax,
        total,
      })
      const serverOrderId = result.order?.id || result.order?.orderNumber
      if (serverOrderId) {
        useStore.setState({ orderId: serverOrderId })
        return serverOrderId
      }
    } catch (err: any) {
      // Fallback for demo mode if backend is down
      const status = err?.status
      if (status === 502 || status === 503 || status === 504 || err?.message?.includes('Failed to fetch')) {
        generateOrderId()
        return useStore.getState().orderId
      }
      throw err
    }
    generateOrderId()
    return null
  }, [cart, shipping, paymentMethod, subtotal, tax, total, generateOrderId])

  const handlePlaceOrder = async () => {
    setOrderLoading(true)
    setOrderError('')
    try {
      await createStoreOrder()
      setOrderPlaced(true)
      clearCart()
      setCheckoutStep(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setOrderLoading(false)
    }
  }

  // PayPal Smart Buttons callbacks
  const handleCreatePaypalOrder = async (data: any, actions: any) => {
    // First create the store order if not already created
    let currentOrderId = createdOrderId
    if (!currentOrderId) {
      setCreatingOrder(true)
      try {
        currentOrderId = await createStoreOrder()
        if (!currentOrderId) throw new Error('Failed to create order')
        setCreatedOrderId(currentOrderId)
      } catch (err: any) {
        setOrderError(err.message || 'Failed to create order')
        throw err
      } finally {
        setCreatingOrder(false)
      }
    }

    try {
      // Create the PayPal order on backend
      const res = await storefront.payments.createPaypalOrder({ orderId: currentOrderId })
      return res.paypalOrderId
    } catch (err: any) {
      // Fallback to client-side order creation if backend is down
      const status = err?.status
      if (status === 502 || status === 503 || status === 504 || err?.message?.includes('Failed to fetch')) {
        return actions.order.create({
          purchase_units: [{
            amount: { value: total.toFixed(2) }
          }]
        })
      }
      throw err
    }
  }

  const handleApprovePaypalOrder = async (data: any, actions: any) => {
    setOrderLoading(true)
    setOrderError('')
    try {
      const orderId = createdOrderId || useStore.getState().orderId
      if (!orderId) throw new Error('Order ID not found')
      
      try {
        await storefront.payments.capturePaypalOrder({
          paypalOrderId: data.orderID,
          orderId: orderId as string,
        })
      } catch (err: any) {
        // Fallback to client-side capture if backend is down
        const status = err?.status
        if (status === 502 || status === 503 || status === 504 || err?.message?.includes('Failed to fetch')) {
          await actions.order.capture()
        } else {
          throw err
        }
      }

      setOrderPlaced(true)
      clearCart()
      setCheckoutStep(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setOrderError(err.message || 'Payment failed. Please try again.')
    } finally {
      setOrderLoading(false)
    }
  }

  const handlePaypalError = (err: any) => {
    console.error('PayPal error:', err)
    setOrderError('PayPal encountered an error. Please try again.')
  }

  const handleContinueShopping = () => {
    setOrderPlaced(false)
    setCheckoutStep(1)
    navigate('/products')
  }

  const updateShipping = (field: string, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: false }))
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 bg-[var(--input-bg)] border text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_var(--focus-ring)] transition-all outline-none rounded-xl ${
      errors[field] ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--input-border)]'
    }`

  // Order confirmation
  if (orderPlaced) {
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
                className="w-full px-4 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] rounded-lg outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_var(--focus-ring)] min-h-[80px] mb-3"
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
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--accent-primary)] text-white font-semibold text-sm border border-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all rounded-xl cursor-pointer"
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

  return (
    <div>
      <SEO
        title="Checkout — Secure Payment"
        description="Complete your order for marine and industrial equipment. Secure checkout with credit card, PayPal, or bank transfer."
        canonical="/checkout"
      />
      {/* Header */}
      <section className="bg-[var(--secondary-bg)] py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-4">
            {t('checkout.headerLabel')}
          </span>
          <h1 className="font-display font-bold text-display-xl tracking-tight">
            {t('checkout.headerTitle')}
          </h1>
          <div className="flex justify-center gap-4 mt-6 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 border border-[var(--border)] text-[var(--accent-primary)] bg-[var(--surface)]">
              <Shield size={12} /> {t('checkout.badgeSecure')}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 border border-[var(--border)] text-[var(--accent-primary)] bg-[var(--surface)]">
              <Truck size={12} /> {t('checkout.badgeGlobal')}
            </span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-[880px] mx-auto px-4 sm:px-6">
          {/* Progress */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm border-2 transition-all ${
                      step === checkoutStep
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
                        : step < checkoutStep
                        ? 'border-[var(--success)] bg-[var(--success)] text-white'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    {step}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      step === checkoutStep
                        ? 'text-[var(--accent-primary)]'
                        : step < checkoutStep
                        ? 'text-[var(--success)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {stepLabels[step - 1]}
                  </span>
                </div>
                {step < 3 && (
                  <div
                    className={`w-20 h-0.5 mx-2 transition-colors ${
                      step < checkoutStep ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Shipping */}
          {checkoutStep === 1 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] p-5 sm:p-8">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <MapPin size={18} className="text-[var(--accent-primary)]" /> {t('checkout.stepShipping')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 mb-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t('checkout.fullName')}</label>
                  <input
                    type="text"
                    value={shipping.fullName}
                    onChange={(e) => updateShipping('fullName', e.target.value)}
                    className={inputClass('fullName')}
                    placeholder={t('checkout.placeholders.fullName')}
                  />
                </div>
                <div className="md:col-span-2 mb-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t('checkout.addressLine1')}</label>
                  <input
                    type="text"
                    value={shipping.addressLine1}
                    onChange={(e) => updateShipping('addressLine1', e.target.value)}
                    className={inputClass('addressLine1')}
                    placeholder={t('checkout.placeholders.addressLine1')}
                  />
                </div>
                <div className="md:col-span-2 mb-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t('checkout.addressLine2')}</label>
                  <input
                    type="text"
                    value={shipping.addressLine2}
                    onChange={(e) => updateShipping('addressLine2', e.target.value)}
                    className={inputClass('addressLine2')}
                    placeholder={t('checkout.placeholders.addressLine2')}
                  />
                </div>
                <div className="mb-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t('checkout.city')}</label>
                  <input
                    type="text"
                    value={shipping.city}
                    onChange={(e) => updateShipping('city', e.target.value)}
                    className={inputClass('city')}
                    placeholder={t('checkout.placeholders.city')}
                  />
                </div>
                <div className="mb-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t('checkout.state')}</label>
                  <input
                    type="text"
                    value={shipping.state}
                    onChange={(e) => updateShipping('state', e.target.value)}
                    className={inputClass('state')}
                    placeholder={t('checkout.placeholders.state')}
                  />
                </div>
                <div className="mb-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t('checkout.postalCode')}</label>
                  <input
                    type="text"
                    value={shipping.postalCode}
                    onChange={(e) => updateShipping('postalCode', e.target.value)}
                    className={inputClass('postalCode')}
                    placeholder={t('checkout.placeholders.postalCode')}
                  />
                </div>
                <div className="mb-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t('checkout.country')}</label>
                  <select
                    value={shipping.country}
                    onChange={(e) => updateShipping('country', e.target.value)}
                    className={inputClass('country')}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394A3B8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      appearance: 'none',
                    }}
                  >
                  {countries.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="w-full flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--accent-primary)] text-white font-semibold text-sm border border-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all mt-6 rounded-xl cursor-pointer"
              >
                {t('checkout.continuePayment')}
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {checkoutStep === 2 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] p-5 sm:p-8">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <CreditCard size={18} className="text-[var(--accent-primary)]" /> {t('checkout.stepPayment')}
              </h3>

              {/* Payment method selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {[
                  { id: 'card', label: t('checkout.paymentCard'), icon: CreditCard },
                  { id: 'paypal', label: t('checkout.paymentPaypal'), icon: PaypalFullLogo },
                  { id: 'bank', label: t('checkout.paymentBank'), icon: Landmark },
                ].map((m) => {
                  const Icon = m.icon
                  return (
                    <label key={m.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id)}
                        className="hidden"
                      />
                      <div
                        className={`flex flex-col items-center justify-center gap-2.5 p-5 border-2 text-center h-[100px] transition-all duration-300 rounded-xl ${
                          paymentMethod === m.id
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                            : 'border-[var(--border)] bg-[var(--primary-bg)] hover:border-[var(--accent-primary)]/40'
                        }`}
                      >
                        {m.id === 'paypal' ? (
                          <PaypalFullLogo />
                        ) : (
                          <Icon size={22} className="text-[var(--accent-primary)]" />
                        )}
                        <span className="text-xs font-semibold text-[var(--text-primary)]">{m.label}</span>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Card fields */}
              {paymentMethod === 'card' && (
                <div className="p-6 bg-[var(--primary-bg)] border border-[var(--border)] text-center rounded-xl">
                  <CreditCard size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Card payments coming soon</p>
                  <p className="text-xs text-[var(--text-secondary)]">Please select PayPal or bank transfer for now.</p>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="p-8 bg-[var(--primary-bg)] border border-[var(--border)] text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t('checkout.paypalDesc')}
                  </p>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="p-8 bg-[var(--primary-bg)] border border-[var(--border)] text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t('checkout.bankDesc')}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5 mt-8">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 bg-transparent text-[var(--accent-primary)] font-semibold text-sm border border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all rounded-xl cursor-pointer"
                >
                  <ChevronLeft size={16} /> {t('checkout.back')}
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--accent-primary)] text-white font-semibold text-sm border border-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all rounded-xl cursor-pointer"
                >
                  {t('checkout.reviewOrder')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {checkoutStep === 3 && (
            <div className="space-y-6">
              {/* Order Items */}
              <div className="bg-[var(--surface)] border border-[var(--border)] p-5 sm:p-8">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Package size={18} className="text-[var(--accent-primary)]" /> {t('checkout.orderItems', { count: getCartCount() })}
                </h3>
                <div className="space-y-4">
                  {cart.map((item) => {
                    const price = item.product.onSale && item.product.salePrice ? item.product.salePrice : item.product.price
                    return (
                      <div key={item.product.id} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-b-0">
                        <OptimizedImage
                          src={getProductImageUrl(item.product.filename)}
                          alt={item.product.name}
                          width={56}
                          height={56}
                          sizes="56px"
                          className="w-14 h-14 object-cover rounded border border-[var(--border)]"
                          loading="lazy"
                          onError={(e) => { const img = e.target as HTMLImageElement; img.src = '/images/placeholder.avif'; img.onerror = null; }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold truncate">{item.product.name}</h4>
                          <p className="text-xs text-[var(--text-muted)]">{item.product.brand} · {item.product.sku}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-[var(--text-muted)]">×{item.quantity}</span>
                          <p className="text-sm font-semibold">${(price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Totals */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-2">
                  <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                    <span>{t('checkout.subtotal')}</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                    <span>{t('checkout.shipping')}</span><span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                    <span>{t('checkout.tax')}</span><span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[var(--text-primary)] pt-3 mt-2 border-t border-[var(--border)]">
                    <span>{t('checkout.grandTotal')}</span><span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Summary */}
              <div className="bg-[var(--surface)] border border-[var(--border)] p-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin size={14} className="text-[var(--accent-primary)]" /> {t('checkout.shippingSummary')}
                  </h4>
                  <button
                    onClick={() => goToStep(1)}
                    className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors bg-transparent border-none cursor-pointer"
                  >
                    {t('checkout.edit')}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {shipping.fullName}<br />
                  {shipping.addressLine1}{shipping.addressLine2 ? `, ${shipping.addressLine2}` : ''}<br />
                  {shipping.city}, {shipping.state} {shipping.postalCode}<br />
                  {shipping.country}
                </p>
              </div>

              {/* Payment Summary */}
              <div className="bg-[var(--surface)] border border-[var(--border)] p-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard size={14} className="text-[var(--accent-primary)]" /> {t('checkout.paymentSummary')}
                  </h4>
                  <button
                    onClick={() => goToStep(2)}
                    className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors bg-transparent border-none cursor-pointer"
                  >
                    {t('checkout.edit')}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {paymentMethod === 'card'
                    ? t('checkout.paymentCard')
                    : paymentMethod === 'paypal'
                    ? t('checkout.paymentPaypal')
                    : t('checkout.paymentBank')}
                </p>
              </div>

              {/* Actions */}
              {orderError && <p className="text-xs text-[var(--danger)] mb-4 text-center">{orderError}</p>}
              <div className="grid grid-cols-2 gap-5">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 bg-transparent text-[var(--accent-primary)] font-semibold text-sm border border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all rounded-xl cursor-pointer"
                >
                  <ChevronLeft size={16} /> {t('checkout.back')}
                </button>
                {paymentMethod === 'paypal' ? (
                  <div className="w-full">
                    {creatingOrder ? (
                      <div className="flex items-center justify-center gap-2 px-7 py-3.5 bg-accent-gold text-navy-deep font-semibold text-sm rounded-full">
                        <Loader2 size={16} className="animate-spin" /> Creating order...
                      </div>
                    ) : paypalScriptLoading ? (
                      <div className="flex items-center justify-center gap-2 px-7 py-3.5 bg-accent-gold text-navy-deep font-semibold text-sm rounded-full">
                        <Loader2 size={16} className="animate-spin" /> Loading PayPal...
                      </div>
                    ) : (
                      <PayPalButtons
                        style={{ layout: 'vertical', shape: 'pill', color: 'gold', label: 'pay', height: 48 }}
                        createOrder={handleCreatePaypalOrder}
                        onApprove={handleApprovePaypalOrder}
                        onError={handlePaypalError}
                        disabled={orderLoading || creatingOrder}
                      />
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={orderLoading}
                    className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--accent-primary)] text-white font-semibold text-sm border border-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all rounded-xl cursor-pointer relative overflow-hidden shimmer-btn disabled:opacity-50"
                  >
                    {orderLoading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><ClipboardCheck size={16} /> {t('checkout.placeOrder')}</>}
                  </button>
                )}
              </div>

              <p className="text-center text-xs text-[var(--text-muted)] mt-2">
                <Shield size={10} className="inline mr-1" />
                {t('checkout.secureFooter')}
              </p>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
