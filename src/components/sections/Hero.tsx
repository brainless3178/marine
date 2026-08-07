import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Search, ShoppingCart } from 'lucide-react'
import { Typewriter } from '@/components/ui/Typewriter'
import { useLocalizedPath } from '@/lib/locale'
import { storefront } from '@/lib/api/storefront'
import type { ApiProduct } from '@/lib/api-types'
import { applyImageFallback, getCategoryImageUrl } from '@/lib/utils'

const TYPED_PHRASES = [
  'Delivered Worldwide.',
  'Sourced Within Hours.',
  'Certified & Tested.',
  'Shipped to 50+ Countries.',
]

const TRUST_BADGES = [
  'Worldwide Shipping',
  'Quality Assured',
  'Buyer Arranged Export',
  'RFQ Support',
]

const GRID_SIZE = 16

interface HeroSquare {
  id: string
  src: string
  alt: string
  /** 'cover' for product photos, 'contain' for logos (never cropped). */
  fit: 'cover' | 'contain'
}

interface HeroTile {
  key: string
  src: string
  alt: string
  fit: 'cover' | 'contain'
}

/**
 * Generated placeholder product images (product-XXX[_category].jpg, served
 * locally or from the Cloudinary /alka/products/ CDN) are NOT real photos —
 * only admin-uploaded images (e.g. /uploads/... or external URLs) pass.
 */
function isGeneratedImageUrl(url?: string | null): boolean {
  if (!url) return true
  const name = url.split('/').pop()?.split('?')[0] || ''
  return (
    /^product-\d{3}(_[a-z0-9-]+)?\.(jpg|jpeg|png|webp|avif)$/i.test(name) ||
    url.includes('/alka/products/')
  )
}

/** Collect up to GRID_SIZE unique products that have a real (uploaded) photo. */
function realSquaresFromProducts(list: ApiProduct[]): HeroSquare[] {
  const seen = new Set<string>()
  const squares: HeroSquare[] = []
  for (const p of list) {
    if (squares.length >= GRID_SIZE) break
    const img = (p.images || []).find((i) => !isGeneratedImageUrl(i.url))
    if (!img || seen.has(img.url)) continue
    seen.add(img.url)
    squares.push({ id: `${p.id}-${squares.length}`, src: img.url, alt: img.altText || p.name, fit: 'cover' })
  }
  return squares
}

/**
 * Real product photos already on the Cloudinary account: the category photos
 * (alka/categories/*) show actual marine & industrial equipment — hydraulic
 * pumps, marine pumps, engine parts, tools, safety gear, navigation.
 * Used as the hero mosaic until real photos are attached to specific
 * catalog products.
 */
const CATEGORY_IMAGE_LABELS: Record<string, string> = {
  'electrical-and-automation': 'Electrical & automation products',
  'engine-parts': 'Engine parts',
  'engine-spare': 'Engine spare parts',
  'equipments-and-tools': 'Equipment & tools',
  'hand-tools': 'Hand tools',
  'hydraulic-pumps-and-motor': 'Hydraulic pumps & motors',
  hydraulics: 'Hydraulics',
  'lifting-and-handling': 'Lifting & handling',
  'marine-pumps': 'Marine pumps',
  'motor-and-components': 'Motors & components',
  'other-businesss-and-industrial': 'Industrial products',
  pneumatics: 'Pneumatics',
  rigging: 'Rigging',
  safety: 'Safety equipment',
  'ship-machinery': 'Ship machinery',
  'ship-navigation': 'Ship navigation',
}

const CLOUDINARY_PRODUCT_SQUARES: HeroSquare[] = Object.keys(CATEGORY_IMAGE_LABELS).map((slug, i) => ({
  id: `category-${i}`,
  src: getCategoryImageUrl(slug),
  alt: CATEGORY_IMAGE_LABELS[slug],
  fit: 'cover',
}))

/**
 * Repeat the available real photos to always fill a balanced mosaic.
 * With few photos (1–3) a compact 2×2 grid avoids heavy duplication;
 * with 4+ photos the full 4×4 grid is filled for a dense shuffle effect.
 */
function fillSquares(list: HeroSquare[]): HeroTile[] {
  if (list.length === 0) return []
  const target = list.length >= 4 ? GRID_SIZE : 4
  const tiles: HeroTile[] = []
  for (let i = 0; i < target; i++) {
    const sq = list[i % list.length]
    tiles.push({ key: `${sq.id}--${i}`, src: sq.src, alt: sq.alt, fit: sq.fit })
  }
  return tiles
}

function shuffleTiles(list: HeroTile[]): HeroTile[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Mosaic of real product photos that reshuffles every 3 seconds. */
function ShuffleGrid({ squares }: { squares: HeroTile[] }) {
  const prefersReducedMotion =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  const [tiles, setTiles] = useState<HeroTile[]>(() =>
    prefersReducedMotion ? squares : shuffleTiles(squares)
  )

  useEffect(() => {
    if (prefersReducedMotion) return
    setTiles(shuffleTiles(squares))
    const id = setInterval(() => setTiles(shuffleTiles(squares)), 3000)
    return () => clearInterval(id)
  }, [prefersReducedMotion, squares])

  const isCompact = squares.length <= 4

  return (
    <div
      className={`grid h-[380px] w-full gap-1.5 sm:h-[450px] ${
        isCompact ? 'grid-cols-2 grid-rows-2' : 'grid-cols-4 grid-rows-4'
      }`}
      role="img"
      aria-label="Featured marine and industrial products from Alka Traders"
    >
      {tiles.map((tile) => (
        <motion.div
          key={tile.key}
          layout
          transition={{ duration: 1.2, type: 'spring', bounce: 0.25 }}
          className={`relative h-full w-full overflow-hidden rounded-lg border border-[var(--hero-border)]/60 shadow-[var(--shadow-card)] ${
            tile.fit === 'contain' ? 'bg-white' : 'bg-[var(--surface-soft)]'
          }`}
        >
          <img
            src={tile.src}
            alt={tile.alt}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full ${
              tile.fit === 'contain' ? 'object-contain p-2' : 'object-cover'
            }`}
            onError={(e) => applyImageFallback(e.currentTarget)}
          />
        </motion.div>
      ))}
    </div>
  )
}

/** Subtle shimmer placeholder while product photos load. */
function GridSkeleton() {
  return (
    <div
      className="grid h-[380px] w-full grid-cols-4 grid-rows-4 gap-1.5 sm:h-[450px]"
      aria-hidden="true"
    >
      {Array.from({ length: GRID_SIZE }).map((_, i) => (
        <div
          key={i}
          className="h-full w-full animate-pulse rounded-lg border border-[var(--hero-border)]/40 bg-[var(--surface-soft)]/60"
        />
      ))}
    </div>
  )
}

export function Hero() {
  const localizedPath = useLocalizedPath()
  const [realSquares, setRealSquares] = useState<HeroSquare[] | null>(null) // null = loading

  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      setRealSquares([])
      return
    }
    let cancelled = false
    storefront.products
      .list({ limit: '250' })
      .then((res) => {
        if (cancelled) return
        setRealSquares(realSquaresFromProducts(res.products || []))
      })
      .catch(() => {
        if (!cancelled) setRealSquares([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Stable identity for the shuffle grid so its 3s interval only restarts
  // when the real-photo set actually changes.
  const filledTiles = useMemo(() => fillSquares(realSquares ?? []), [realSquares])
  const productPhotoTiles = useMemo(() => fillSquares(CLOUDINARY_PRODUCT_SQUARES), [])

  return (
    <section
      aria-label="Alka Traders — trusted marine spare parts delivered worldwide"
      className="relative -mt-[var(--hero-header-offset)] flex min-h-[calc(100vh_+_var(--hero-header-offset))] items-center overflow-hidden bg-[var(--hero-bg)] supports-[height:100svh]:min-h-[calc(100svh_+_var(--hero-header-offset))]"
    >
      {/* Minimal ambient gradients — depth without heavy media. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--hero-glow-teal),transparent_55%),radial-gradient(ellipse_at_bottom_right,var(--hero-glow-gold),transparent_50%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--hero-bg)]/60 via-transparent to-[var(--hero-bg)]"
        aria-hidden="true"
      />

      <div className="site-container relative z-10 pt-[var(--hero-header-offset)] pb-16 sm:pb-20 lg:pb-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          {/* Copy column */}
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
            <span className="hero-reveal inline-flex items-center gap-2 rounded-full border border-[var(--hero-border)] bg-[var(--hero-chip-bg)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hero-text-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hero-accent)]" aria-hidden="true" />
              Marine &amp; Industrial Procurement
            </span>

            <h1
              className="hero-reveal mt-6 font-manrope text-[clamp(2.5rem,5.2vw,4.25rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-[var(--hero-text)]"
              style={{ animationDelay: '60ms' }}
            >
              Trusted Marine Spare Parts.
              <Typewriter
                phrases={TYPED_PHRASES}
                className="mt-1 block text-[var(--hero-accent-hover)]"
              />
            </h1>

            <p
              className="hero-reveal mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--hero-text-secondary)] lg:mx-0"
              style={{ animationDelay: '120ms' }}
            >
              Global sourcing for ship owners, yards, and maintenance teams — shop online or send an
              RFQ and our team will source it.
            </p>

            <div
              className="hero-reveal mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
              style={{ animationDelay: '160ms' }}
            >
              <Link to={localizedPath('/shop')} className="hero-btn-primary px-7 py-3.5 no-underline">
                <ShoppingCart size={18} strokeWidth={2} /> Shop Products
              </Link>
              <Link
                to={localizedPath('/products?search=ship%20spares')}
                className="hero-btn-secondary px-7 py-3.5 no-underline"
              >
                <Search size={18} strokeWidth={2} /> Search Ship Spares
              </Link>
            </div>

            <ul
              className="hero-reveal mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 lg:justify-start"
              style={{ animationDelay: '200ms' }}
            >
              {TRUST_BADGES.map((badge) => (
                <li
                  key={badge}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--hero-text-secondary)]"
                >
                  <Check size={15} strokeWidth={2.5} className="shrink-0 text-[var(--hero-accent)]" />
                  {badge}
                </li>
              ))}
            </ul>
          </div>

          {/* Real images from Cloudinary — shuffle grid */}
          <div className="hero-reveal mx-auto w-full max-w-[540px]" style={{ animationDelay: '140ms' }}>
            {realSquares === null ? (
              <GridSkeleton />
            ) : realSquares.length > 0 ? (
              <ShuffleGrid squares={filledTiles} />
            ) : (
              <ShuffleGrid squares={productPhotoTiles} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
