import { useState, useCallback } from 'react'
import { ZoomIn, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OptimizedImage } from '../ui/OptimizedImage'
import { getProductImageUrl, isLightColor } from '../../lib/utils'
import type { Product } from '../../types'

interface ProductImageGalleryProps {
  product: Product
}

export function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const { t } = useTranslation()
  const [showZoom, setShowZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [showShare, setShowShare] = useState(false)

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
      try {
        await navigator.share({ title: product?.name || 'Alka Traders Product', url })
      } catch (e) {
        if ((e as Error).name !== 'AbortError') navigator.clipboard?.writeText(url)
      }
    } else {
      navigator.clipboard?.writeText(url)
      setShowShare(true)
      setTimeout(() => setShowShare(false), 2000)
    }
  }

  return (
    <>
      <div
        className="relative bg-[var(--secondary-bg)] border border-[var(--border)] p-4 rounded-2xl overflow-hidden group cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
      >
        <div className="overflow-hidden rounded-xl bg-[var(--primary-bg)] h-[350px] sm:h-[450px] flex items-center justify-center relative">
          <OptimizedImage
            src={getProductImageUrl(product.filename)}
            alt={product.name}
            width={600}
            height={600}
            loading="eager"
            sizes="(max-width: 768px) 100vw, 55vw"
            className={`w-full h-full object-contain p-2 transition-transform duration-200 ${showZoom ? 'scale-150' : 'scale-100'}`}
            style={showZoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
            onError={(e) => { const img = e.target as HTMLImageElement; img.src = '/images/placeholder.jpg'; img.onerror = null; }}
          />
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-xs text-white px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 opacity-0 group-hover:opacity-80 transition-opacity">
            <ZoomIn size={12} /> {t('product.hoverToZoom')}
          </div>
          {product.customLabel && (
            <span
              className="absolute top-3 left-3 z-10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-lg shadow-lg"
              style={{
                backgroundColor: product.customLabelColor || '#159a67',
                color: isLightColor(product.customLabelColor || '#159a67') ? '#1a1a1a' : '#ffffff',
              }}
            >
              {product.customLabel}
            </span>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="text-white font-bold text-lg bg-black/70 px-6 py-3 rounded-xl">{t('product.outOfStock')}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleShare}
          className="absolute top-6 right-6 z-10 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 hover:border-[var(--accent-gold)] transition-colors"
          aria-label={t('product.ariaShare')}
        >
          <Share2 size={16} className="text-[var(--text-secondary)]" />
        </button>
      </div>
      {showShare && (
        <div className="mt-2 bg-[var(--success)] text-[var(--btn-success-text)] text-xs font-bold px-4 py-2 rounded-lg inline-block">
          {t('product.linkCopied')}
        </div>
      )}
    </>
  )
}
