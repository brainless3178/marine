import { useState, useEffect } from 'react'
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
  Minus,
  Plus,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useStoreSettings } from '../hooks/useStoreSettings'
import { SEO } from '../components/seo/SEO'
import { BreadcrumbJsonLd } from '../components/seo/BreadcrumbJsonLd'
import { storefront } from '../lib/api'
import { apiProductToFrontend, apiProductsToFrontend } from '../lib/adapters'
import { getProductImageUrl } from '../lib/utils'
import { products as staticProducts } from '../data/products'
import { ProductImageGallery } from '../components/product/ProductImageGallery'
import { OfferModal } from '../components/product/OfferModal'
import { RelatedProducts } from '../components/product/RelatedProducts'
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

function getSchemaCondition(condition: Product['condition']) {
  if (condition === 'new' || condition === 'unused') return 'https://schema.org/NewCondition'
  if (condition === 'refurbished' || condition === 'reconditioned') return 'https://schema.org/RefurbishedCondition'
  return 'https://schema.org/UsedCondition'
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

  // Fetch product from API with fallback to static products
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
          return
        }
      } catch {
        console.warn('[ProductDetail] API fetch failed — falling back to static product data')
      }

      const cleanId = id!.toLowerCase().replace(/^prod-/, '')
      const staticProduct = staticProducts.find(
        (p) => p.id === id || p.id === `prod-${cleanId}` || p.id.replace('prod-', '') === cleanId
      )
      if (!cancelled) {
        if (staticProduct) {
          setProduct(staticProduct)
          setRelated(
            staticProducts
              .filter((p) => p.id !== staticProduct.id && p.category === staticProduct.category)
              .slice(0, 4)
          )
        }
      }
      if (!cancelled) setLoading(false)
    }
    load().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    window.scrollTo(0, 0)
    setAdded(false)
    setQuantity(1)
  }, [id])

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent animate-spin mx-auto" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-24 text-center">
        <h2 className="text-2xl font-bold mb-2">{t('product.productNotFound')}</h2>
        <p className="text-body-sm text-[var(--text-secondary)] mb-6">{t('product.productNotFoundDesc')}</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-primary)] text-[var(--btn-blue-text)] font-semibold rounded-xl hover:bg-[var(--accent-primary-hover)] transition-all">
          <ArrowLeft size={16} /> {t('product.backToProducts')}
        </Link>
      </div>
    )
  }

  const price = product.price
  const effectivePrice = product.onSale && product.salePrice ? product.salePrice : price
  const specs = getProductSpecs(product)
  const readableCategory = product.category.replace(/-/g, ' ')
  const productSeoTitle = `${product.name} | ${product.brand} ${readableCategory} spare`
  const productSeoDescription = `${product.name} (${product.sku}) by ${product.brand}. ${product.condition} ${readableCategory} for marine spare parts, ship spares, industrial MRO, and export supply from Bhavnagar, India.`

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

  return (
    <div className="py-8">
      <SEO
        title={productSeoTitle}
        description={productSeoDescription.slice(0, 158)}
        canonical={`/product/${id}`}
        ogImage={product ? getProductImageUrl(product.filename) : undefined}
        ogType="product"
        productPrice={effectivePrice}
        productCurrency="USD"
        productAvailability={product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}
        productSku={product.sku}
        productBrand={product.brand}
        productCategory={readableCategory}
        productCondition={getSchemaCondition(product.condition)}
        ogImageAlt={product.name}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: productSeoTitle,
            description: productSeoDescription,
            mainEntity: {
              '@type': 'Product',
              name: product.name,
              sku: product.sku,
              category: readableCategory,
              brand: { '@type': 'Brand', name: product.brand },
            },
          },
        ]}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' },
        { name: product.category.replace(/-/g, ' '), url: `/products?category=${product.category}` },
        { name: product.name, url: `/product/${id}` },
      ]} />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors mb-6 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={14} /> {t('product.backToCatalog')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
          {/* LEFT COLUMN: Gallery */}
          <ProductImageGallery product={product} />

          {/* RIGHT COLUMN: Details */}
          <div className="space-y-6 text-left">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono mb-2">
                <Link to="/shop" className="hover:text-[var(--accent-primary)]">{t('nav.shop')}</Link>
                <span>/</span>
                <span className="capitalize">{product.category.replace(/-/g, ' ')}</span>
              </div>
              <h1 className="font-display font-bold text-2xl lg:text-3xl tracking-tight text-[var(--text-primary)] leading-snug">{product.name}</h1>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-0.5 border text-[var(--accent-primary)] border-[var(--info-border)] bg-[var(--surface)] rounded">
                  {t('product.brandPrefix', { brand: product.brand })}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">{t('product.skuPrefix', { sku: product.sku })}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 border text-[var(--text-secondary)] border-[var(--border)] rounded">
                  {t('product.conditionLabel', { condition: product.condition.charAt(0).toUpperCase() + product.condition.slice(1) })}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="border-y border-[var(--border)] py-4 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                {product.onSale && product.salePrice ? (
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-4xl text-[var(--danger)] tabular-nums">
                      ${product.salePrice.toFixed(2)}
                    </span>
                    <span className="font-display font-bold text-xl text-[var(--text-muted)] line-through tabular-nums">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold bg-[var(--danger)] text-[var(--btn-danger-text)] px-2 py-0.5 rounded">
                      {t('product.percentageOff', { percent: Math.round((1 - product.salePrice / product.price) * 100) })}
                    </span>
                  </div>
                ) : (
                  <span className="font-display font-bold text-4xl text-[var(--accent-primary)] tabular-nums">
                    ${effectivePrice.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="text-right flex items-center gap-2">
                {product.inStock ? (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
                    <span className="text-xs font-mono text-[var(--text-secondary)]">
                      {t('product.stockAvailable', { count: product.stockCount })}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--danger)]" />
                    <span className="text-xs font-mono text-[var(--danger)]">{t('product.outOfStock')}</span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="p-4 bg-[var(--secondary-bg)] border border-[var(--border)] rounded-xl text-xs leading-relaxed">
              <p className="text-[var(--text-secondary)]">{product.description}</p>
            </div>

            {/* Condition detail */}
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

            {/* In Stock Actions */}
            {product.inStock && (
              <>
                <div className="flex items-center gap-4 border border-[var(--border)] bg-[var(--secondary-bg)] p-2 rounded-xl justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] pl-2">{t('product.quantity')}</span>
                  <div className="flex items-center gap-1 bg-[var(--primary-bg)] p-0.5 rounded-full">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--border)] transition-colors border-none cursor-pointer font-bold text-[var(--text-secondary)] text-sm"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="min-w-[28px] text-center text-xs font-semibold text-[var(--text-primary)]">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--border)] transition-colors border-none cursor-pointer font-bold text-[var(--text-secondary)] text-sm"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 text-xs font-semibold rounded-xl transition-all duration-300 border cursor-pointer ${
                      added
                        ? 'border-[var(--success)] bg-[var(--success)] text-[var(--btn-success-text)]'
                        : 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--btn-blue-text)] hover:bg-[var(--accent-primary-hover)]'
                    }`}
                  >
                    {added ? <><Check size={14} /> {t('product.added')}</> : <><ShoppingCart size={14} /> {t('product.addToCartUpper')}</>}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-semibold rounded-xl bg-transparent border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-[var(--btn-blue-text)] hover:text-[var(--btn-blue-text)] transition-all cursor-pointer"
                  >
                    {t('product.buyNow')}
                  </button>
                </div>

                {product.makeOffer && (
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-[var(--border)] hover:border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    <Percent size={14} /> {t('product.makeOffer')}
                  </button>
                )}
              </>
            )}

            {/* Out of Stock */}
            {!product.inStock && (
              <div className="p-4 bg-[var(--surface-soft)] border border-[var(--border)] rounded-xl text-center">
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">{t('product.outOfStockMsg')}</p>
                <p className="text-xs text-[var(--text-muted)] mb-3">{t('product.checkAvailability')}</p>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[var(--accent-primary)] text-[var(--btn-blue-text)] font-bold px-6 py-2.5 rounded-xl text-xs transition-all hover:bg-[var(--accent-primary-hover)] no-underline"
                >
                  <MessageCircle size={14} /> {t('product.inquireWhatsApp')}
                </a>
              </div>
            )}

            {/* Specs */}
            <div className="border-t border-[var(--border)] pt-4 space-y-2.5 text-xs">
              {Object.entries(specs).map(([key, val]) => (
                <div key={key} className="grid grid-cols-[auto_1fr] border-b border-[var(--border)]/40 pb-2">
                  <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wide text-xs">
                    {t(`product.${key}`)}
                  </span>
                  <span className="text-[var(--text-primary)] min-w-0 break-words">{val}</span>
                </div>
              ))}
            </div>

            {/* Trust badges */}
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
            <span className="inline-block border-b-2 border-[var(--accent-primary)] pb-2 font-semibold text-sm text-[var(--accent-primary)] tracking-wide uppercase">
              {t('product.description')}
            </span>
          </div>
          <div className="space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed max-w-[800px]">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] uppercase text-base mb-2">{product.name}</h3>
              <p className="font-semibold text-[var(--accent-teal)]">
                {product.condition === 'new' ? t('product.conditionNewUpper')
                  : product.condition === 'reconditioned' ? t('product.conditionReconditionedUpper')
                  : product.condition === 'refurbished' ? t('product.conditionRefurbishedUpper')
                  : product.condition === 'unused' ? t('product.conditionUnusedUpper')
                  : t('product.conditionUsedUpper')}
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
            {([
              { title: '30 ' + t('product.days'), desc: t('product.returnPolicy'), icon: RotateCcw },
              { title: t('product.dedicated'), desc: t('product.afterSales'), icon: MessageCircle },
              { title: t('product.sameDay'), desc: t('product.dispatchGuarantee'), icon: Truck },
              { title: t('product.allUnits'), desc: t('product.fullyTested'), icon: ShieldCheck },
            ] as const).map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="bg-[var(--primary-bg)] border border-[var(--border)] p-4 rounded-xl flex flex-col items-center">
                  <Icon className="text-[var(--accent-primary)] mb-2.5" size={24} />
                  <span className="text-xs font-bold text-[var(--text-primary)] block">{item.title}</span>
                  <span className="text-xs text-[var(--text-muted)]">{item.desc}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* RELATED PRODUCTS */}
        <RelatedProducts products={related} />
      </div>

      {/* OFFER MODAL */}
      {showOfferModal && product.makeOffer && (
        <OfferModal product={product} onClose={() => setShowOfferModal(false)} />
      )}
    </div>
  )
}
