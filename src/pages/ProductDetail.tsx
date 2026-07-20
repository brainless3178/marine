import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ShoppingCart,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageCircle,
  Percent,
  ZoomIn,
  Share2,
  X,
  Minus,
  Plus,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useStoreSettings } from '../hooks/useStoreSettings'
import { SEO } from '../components/seo/SEO'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { storefront } from '../lib/api'
import { apiProductToFrontend, apiProductsToFrontend } from '../lib/adapters'
import { isLightColor } from '../lib/utils'
import type { Product } from '../types'

function getProductSpecs(product: Product): Record<string, string> {
  if (product.specs && Object.keys(product.specs).length > 0) {
    return product.specs
  }
  return {
    'Brand': product.brand,
    'Category': product.category.replace(/-/g, ' '),
    'Condition': product.condition,
  }
}

export default function ProductDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn, setShowAuthModal, addToCart } = useStore()
  const { whatsappNumber } = useStoreSettings()
  
  const [product, setProduct] = useState<Product | undefined>(undefined)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerPrice, setOfferPrice] = useState('')
  const [offerEmail, setOfferEmail] = useState('')
  const [offerSuccess, setOfferSuccess] = useState(false)
  const [offerError, setOfferError] = useState('')
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [showShare, setShowShare] = useState(false)

  // Fetch product from API
  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const res = await storefront.products.get(id!)
        if (!cancelled && res.product) {
          setProduct(apiProductToFrontend(res.product))
          if (res.related?.length) {
            setRelated(apiProductsToFrontend(res.related).slice(0, 4))
          }
        }
      } catch {
        // API unavailable — product not found
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    window.scrollTo(0, 0)
    setAdded(false)
    setQuantity(1)
    setOfferSuccess(false)
    setOfferPrice('')
    setOfferEmail('')
    setOfferError('')
  }, [id])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!showZoom) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [showZoom])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: product?.name || 'Alka Traders Product', url }) } catch (e) { if ((e as Error).name !== 'AbortError') navigator.clipboard?.writeText(url) }
    } else { navigator.clipboard?.writeText(url); setShowShare(true); setTimeout(() => setShowShare(false), 2000) }
  }

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent animate-spin mx-auto" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-24 text-center">
        <h2 className="text-2xl font-bold mb-2">{t('product.productNotFound')}</h2>
        <p className="text-body-sm text-[var(--text-secondary)] mb-6">{t('product.productNotFoundDesc')}</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--brick-ember)] text-[var(--honeydew)] font-semibold rounded-full hover:bg-[#9a2509] transition-all">
          <ArrowLeft size={16} /> {t('product.backToProducts')}
        </Link>
      </div>
    )
  }

  const price = product.price
  const effectivePrice = product.onSale && product.salePrice ? product.salePrice : price
  const specs = getProductSpecs(product)

  const handleAddToCart = () => {
    if (!isLoggedIn) { setShowAuthModal(true); return }
    if (!product.inStock) return
    for (let i = 0; i < quantity; i++) addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    if (!isLoggedIn) { setShowAuthModal(true); return }
    addToCart(product)
    navigate('/checkout')
  }

  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerPrice || !offerEmail || !product) return
    setOfferSubmitting(true)
    setOfferError('')
    try {
      await storefront.offers.submit({
        productId: product.id,
        customerEmail: offerEmail,
        offeredPrice: parseFloat(offerPrice),
      })
      setOfferSuccess(true)
      setTimeout(() => { setShowOfferModal(false); setOfferSuccess(false); setOfferPrice(''); setOfferEmail('') }, 2500)
    } catch (err: any) {
      setOfferError(err.message || 'Failed to submit offer. Please try again.')
    } finally {
      setOfferSubmitting(false)
    }
  }

  return (
    <div className="py-8">
      <SEO
        title={product ? `${product.name} — Alka Traders` : 'Product Detail — Alka Traders'}
        description={product ? product.description?.slice(0, 160) || `${product.name} — ${product.brand}, ${product.condition}. SKU: ${product.sku}.` : 'View product details'}
        canonical={`/product/${id}`}
        ogImage={product ? `/images/${product.filename}` : undefined}
      />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs font-semibold text-accent-blue hover:text-accent-teal transition-colors mb-6 bg-transparent border-none cursor-pointer">
          <ArrowLeft size={14} /> {t('product.backToCatalog')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
          {/* LEFT COLUMN: Gallery */}
          <div>
            <div className="relative bg-[var(--secondary-bg)] border border-[var(--border)] p-4 rounded-2xl overflow-hidden group cursor-crosshair" onMouseMove={handleMouseMove} onMouseEnter={() => setShowZoom(true)} onMouseLeave={() => setShowZoom(false)}>
              <div className="overflow-hidden rounded-xl bg-[var(--primary-bg)] h-[350px] sm:h-[450px] flex items-center justify-center relative">
                <OptimizedImage src={`/images/${product.filename}`} alt={product.name} width={600} height={600} loading="eager" sizes="(max-width: 768px) 100vw, 55vw" className={`w-full h-full object-contain p-2 transition-transform duration-200 ${showZoom ? 'scale-150' : 'scale-100'}`} style={showZoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined} onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }} />
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-xs text-white px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 opacity-0 group-hover:opacity-80 transition-opacity">
                  <ZoomIn size={12} /> {t('product.hoverToZoom')}
                </div>
                {product.customLabel && (
                  <span className="absolute top-3 left-3 z-10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-lg shadow-lg" style={{ backgroundColor: product.customLabelColor || '#159a67', color: isLightColor(product.customLabelColor || '#159a67') ? '#1a1a1a' : '#ffffff' }}>
                    {product.customLabel}
                  </span>
                )}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <span className="text-white font-bold text-lg bg-black/70 px-6 py-3 rounded-xl">{t('product.outOfStock')}</span>
                  </div>
                )}
              </div>
              <button onClick={handleShare} className="absolute top-6 right-6 z-10 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 hover:border-[var(--accent-gold)] transition-colors" aria-label={t('product.ariaShare')}>
                <Share2 size={16} className="text-[var(--text-secondary)]" />
              </button>
            </div>
            {showShare && (
              <div className="mt-2 bg-[var(--success)] text-white text-xs font-bold px-4 py-2 rounded-lg inline-block">{t('product.linkCopied')}</div>
            )}
          </div>

          {/* RIGHT COLUMN: Details */}
          <div className="space-y-6 text-left">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono mb-2">
                <Link to="/shop" className="hover:text-[var(--accent-blue)]">{t('nav.shop')}</Link>
                <span>/</span>
                <span className="capitalize">{product.category.replace(/-/g, ' ')}</span>
              </div>
              <h1 className="font-display font-bold text-display-lg tracking-tight text-[var(--text-primary)] leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-0.5 border text-[var(--accent-blue)] border-[rgba(14,165,233,0.3)] bg-[var(--surface)] rounded">{t('product.brandPrefix', { brand: product.brand })}</span>
                <span className="text-xs font-mono text-[var(--text-muted)]">{t('product.skuPrefix', { sku: product.sku })}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 border text-[var(--text-secondary)] border-[var(--border)] rounded">{t('product.conditionLabel', { condition: product.condition.charAt(0).toUpperCase() + product.condition.slice(1) })}</span>
              </div>
            </div>

            <div className="border-y border-[var(--border)] py-4 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                {product.onSale && product.salePrice ? (
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-4xl text-[var(--danger)] tabular-nums">${product.salePrice.toFixed(2)}</span>
                    <span className="font-display font-bold text-xl text-[var(--text-muted)] line-through tabular-nums">${product.price.toFixed(2)}</span>
                    <span className="text-xs font-bold bg-[var(--danger)] text-white px-2 py-0.5 rounded">{t('product.percentageOff', { percent: Math.round((1 - product.salePrice / product.price) * 100) })}</span>
                  </div>
                ) : (
                  <span className="font-display font-bold text-4xl text-[var(--accent-blue)] tabular-nums">${effectivePrice.toFixed(2)}</span>
                )}
              </div>
              <div className="text-right flex items-center gap-2">
                {product.inStock ? (
                  <><span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse" /><span className="text-xs font-mono text-[var(--text-secondary)]">{t('product.stockAvailable', { count: product.stockCount })}</span></>
                ) : (
                  <><span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--danger)]" /><span className="text-xs font-mono text-[var(--danger)]">{t('product.outOfStock')}</span></>
                )}
              </div>
            </div>

            <div className="p-4 bg-[var(--secondary-bg)] border border-[var(--border)] rounded-xl text-xs leading-relaxed">
              <p className="text-[var(--text-secondary)]">{product.description}</p>
            </div>

            <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border)] rounded-xl text-xs leading-relaxed">
              <div>
                <span className="font-bold text-[var(--text-primary)] uppercase tracking-wide block mb-1">{t('product.condition')}</span>
                <p className="text-[var(--text-secondary)]">
                  {product.condition === 'new' && t('product.conditionNew')}
                  {product.condition === 'refurbished' && t('product.conditionRefurbished')}
                  {product.condition === 'used' && t('product.conditionUsed')}
                  {product.condition === 'reconditioned' && t('product.conditionReconditioned')}
                  {product.condition === 'unused' && t('product.conditionUnused')}
                </p>
              </div>
            </div>

            {product.inStock && (
              <>
                <div className="flex items-center gap-4 border border-[var(--border)] bg-[var(--secondary-bg)] p-2 rounded-xl justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] pl-2">{t('product.quantity')}</span>
                  <div className="flex items-center gap-1 bg-[var(--primary-bg)] p-0.5 rounded-full">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--border)] transition-colors border-none cursor-pointer font-bold text-[var(--text-secondary)] text-sm"><Minus size={12} /></button>
                    <span className="min-w-[28px] text-center text-xs font-semibold text-[var(--text-primary)]">{quantity}</span>
                    <button onClick={() => setQuantity((q) => q + 1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--border)] transition-colors border-none cursor-pointer font-bold text-[var(--text-secondary)] text-sm"><Plus size={12} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={handleAddToCart} className={`w-full flex items-center justify-center gap-2 py-3.5 text-xs font-semibold rounded-full transition-all duration-300 border cursor-pointer ${added ? 'border-[var(--success)] bg-[var(--success)] text-white' : 'border-[var(--brick-ember)] bg-[var(--brick-ember)] text-[var(--honeydew)] hover:bg-[#9a2509]'}`}>
                    {added ? <><Check size={14} /> {t('product.added')}</> : <><ShoppingCart size={14} /> {t('product.addToCartUpper')}</>}
                  </button>
                  <button onClick={handleBuyNow} className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-semibold rounded-full bg-[var(--accent-blue)] border border-[var(--accent-blue)] text-white hover:bg-[var(--muted-teal)] transition-all cursor-pointer">
                    {t('product.buyNow')}
                  </button>
                </div>

                {product.makeOffer && (
                  <button onClick={() => setShowOfferModal(true)} className="w-full flex items-center justify-center gap-2 py-3 border border-[var(--border)] hover:border-[var(--accent-blue)] text-[var(--accent-blue)] bg-transparent font-semibold text-xs rounded-full transition-colors cursor-pointer">
                    <Percent size={14} /> {t('product.makeOffer')}
                  </button>
                )}
              </>
            )}

            {!product.inStock && (
              <div className="p-4 bg-[var(--surface-soft)] border border-[var(--border)] rounded-xl text-center">
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">{t('product.outOfStockMsg')}</p>
                <p className="text-xs text-[var(--text-muted)] mb-3">{t('product.checkAvailability')}</p>
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[var(--accent-gold)] text-[#111827] font-bold px-6 py-2.5 rounded-xl text-xs transition-all hover:bg-[var(--gold-light)] no-underline">
                  <MessageCircle size={14} /> {t('product.inquireWhatsApp')}
                </a>
              </div>
            )}

            <div className="border-t border-[var(--border)] pt-4 space-y-2.5 text-xs">
              {Object.entries(specs).map(([key, val]) => (
                <div key={key} className="grid grid-cols-[auto_1fr] border-b border-[var(--border)]/40 pb-2">
                  <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wide text-xs">{t(`product.${key}`)}</span>
                  <span className="text-[var(--text-primary)] min-w-0 break-words">{val}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs font-mono text-[var(--text-secondary)]">
              <div className="border border-[var(--border)] p-2 bg-[var(--secondary-bg)] text-center rounded">{t('product.topRated')}</div>
              <div className="border border-[var(--border)] p-2 bg-[var(--secondary-bg)] text-center rounded">{t('product.fedexDelivery')}</div>
              <div className="border border-[var(--border)] p-2 bg-[var(--secondary-bg)] text-center rounded">{t('product.sameDayShipping')}</div>
              <div className="border border-[var(--border)] p-2 bg-[var(--secondary-bg)] text-center rounded">{t('product.freeReturns')}</div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION SECTION */}
        <section className="mt-16 border-t border-[var(--border)] pt-10 text-left">
          <div className="border-b border-[var(--border)] mb-6">
            <span className="inline-block border-b-2 border-[var(--accent-blue)] pb-2 font-semibold text-sm text-[var(--accent-blue)] tracking-wide uppercase">{t('product.description')}</span>
          </div>
          <div className="space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed max-w-[800px]">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] uppercase text-base mb-2">{product.name}</h3>
              <p className="font-semibold text-[var(--accent-teal)]">
                {product.condition === 'new' ? t('product.conditionNewUpper') : product.condition === 'reconditioned' ? t('product.conditionReconditionedUpper') : product.condition === 'refurbished' ? t('product.conditionRefurbishedUpper') : product.condition === 'unused' ? t('product.conditionUnusedUpper') : t('product.conditionUsedUpper')}
              </p>
              <p className="mt-2 text-[var(--success)] font-medium">{t('product.freeShipping')}</p>
              <p className="text-[var(--text-muted)] text-xs mt-1">{t('product.importDuty')}</p>
            </div>
            <div className="space-y-3 text-xs text-[var(--text-secondary)] bg-[var(--secondary-bg)] border border-[var(--border)] p-5 rounded-xl">
              <h4 className="font-bold text-[var(--text-primary)] text-sm mb-2">{t('product.shippingInfo')} :-</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('product.shippingLine1')}</li>
                <li>{t('product.shippingLine2')}</li>
                <li>{t('product.shippingLine3')}</li>
                <li>{t('product.shippingLine4')}</li>
                <li>{t('product.shippingLine5')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* We've Got You Covered */}
        <section className="mt-16 bg-[var(--secondary-bg)] border border-[var(--border)] p-8 rounded-2xl text-center">
          <h3 className="heading-xl text-[var(--text-primary)] mb-2 uppercase">{t('product.weGotYou')}</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-[640px] mx-auto leading-relaxed mb-8">{t('product.weGotYouSub')}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: '30 ' + t('product.days'), desc: t('product.returnPolicy'), icon: RotateCcw },
              { title: t('product.dedicated'), desc: t('product.afterSales'), icon: MessageCircle },
              { title: t('product.sameDay'), desc: t('product.dispatchGuarantee'), icon: Truck },
              { title: t('product.allUnits'), desc: t('product.fullyTested'), icon: ShieldCheck },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="bg-[var(--primary-bg)] border border-[var(--border)] p-4 rounded-xl flex flex-col items-center">
                  <Icon className="text-[var(--accent-blue)] mb-2.5" size={24} />
                  <span className="text-xs font-bold text-[var(--text-primary)] block">{item.title}</span>
                  <span className="text-xs text-[var(--text-muted)]">{item.desc}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[var(--border)] text-left">
            <h2 className="heading-xl mb-6 text-[var(--text-primary)]">{t('product.relatedProducts')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((item) => {
                const itemPrice = item.onSale && item.salePrice ? item.salePrice : item.price
                return (
                  <div key={item.id} className="bg-[var(--secondary-bg)] border border-[var(--border)] overflow-hidden transition-all duration-300 hover:border-l-[var(--accent-blue)] hover:-translate-y-1 rounded-xl group flex flex-col justify-between">
                    <Link to={`/product/${item.id}`} className="overflow-hidden bg-[var(--primary-bg)] flex items-center justify-center relative block">
                      <OptimizedImage src={`/images/${item.filename}`} alt={item.name} width={400} height={400} loading="lazy" sizes="(max-width: 1024px) 50vw, 25vw" className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }} />
                      {item.customLabel && (
                        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-xs font-extrabold uppercase rounded" style={{ backgroundColor: item.customLabelColor || '#159a67', color: isLightColor(item.customLabelColor || '#159a67') ? '#1a1a1a' : '#ffffff' }}>{item.customLabel}</span>
                      )}
                    </Link>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1">{item.brand}</span>
                        <Link to={`/product/${item.id}`} className="text-xs font-semibold leading-tight text-[var(--text-primary)] hover:text-[var(--accent-blue)] block mb-2 line-clamp-2">{item.name}</Link>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]/40">
                        <div className="flex items-center gap-2">
                          {item.onSale && item.salePrice ? (
                            <><span className="font-display font-bold text-sm text-[var(--danger)]">${item.salePrice.toFixed(2)}</span><span className="font-display font-bold text-xs text-[var(--text-muted)] line-through">${item.price.toFixed(2)}</span></>
                          ) : (
                            <span className="font-display font-bold text-sm text-[var(--accent-blue)]">${itemPrice.toFixed(2)}</span>
                          )}
                        </div>
                        <Link to={`/product/${item.id}`} className="text-xs font-semibold text-[var(--accent-blue)] hover:underline">{t('product.viewInfo')}</Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* MAKE AN OFFER MODAL */}
      {showOfferModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] text-[var(--text-primary)] w-full max-w-[420px] rounded-2xl shadow-2xl border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('product.offerTitle')}</h3>
              <button onClick={() => setShowOfferModal(false)} className="bg-transparent border-none cursor-pointer p-1 hover:bg-[var(--surface-soft)] rounded"><X size={18} className="text-[var(--text-secondary)]" /></button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">{t('product.makeOfferDesc', { product: product.name })}</p>
            {offerSuccess ? (
              <div className="py-8 text-center space-y-3">
                <Check className="w-12 h-12 text-[var(--success)] mx-auto animate-bounce" />
                <p className="text-sm font-semibold">{t('product.offerSubmitted')}</p>
                <p className="text-xs text-[var(--text-muted)]">{t('product.offerCopySent', { email: offerEmail })}</p>
              </div>
            ) : (
              <form onSubmit={handleMakeOffer} className="space-y-4 text-left">
                {offerError && <p className="text-xs text-[var(--danger)] text-center">{offerError}</p>}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">{t('product.yourOffer')}</label>
                  <input type="number" required placeholder={t('product.offerPlaceholder', { amount: (effectivePrice * 0.85).toFixed(0) })} value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="w-full px-4 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] rounded-lg outline-none focus:border-[var(--accent-blue)]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">{t('product.email')}</label>
                  <input type="email" required placeholder={t('product.emailPlaceholder')} value={offerEmail} onChange={(e) => setOfferEmail(e.target.value)} className="w-full px-4 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] rounded-lg outline-none focus:border-[var(--accent-blue)]" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button type="button" onClick={() => setShowOfferModal(false)} className="w-full py-3 border border-[var(--border)] bg-transparent font-semibold text-xs rounded-full transition-colors cursor-pointer hover:border-[var(--danger)] hover:text-[var(--danger)]">{t('product.cancel')}</button>
                  <button type="submit" disabled={offerSubmitting} className="w-full py-3 bg-[var(--brick-ember)] text-[var(--honeydew)] font-semibold text-xs border border-[var(--brick-ember)] hover:bg-[#9a2509] transition-all rounded-full cursor-pointer disabled:opacity-50">
                    {offerSubmitting ? 'Submitting...' : t('product.submitOffer')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
