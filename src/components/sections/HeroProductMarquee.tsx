import { useState } from 'react'
import type { Product } from '../../types'
import { getProductImageUrl } from '../../lib/utils'

interface HeroProductMarqueeProps {
  products: Product[]
  direction?: 'left' | 'right'
  speed?: 'normal' | 'slow'
}

function MarqueeCard({ product }: { product: Product }) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <a
      href={`/product/${product.id}`}
      className="product-marquee-card no-underline group"
    >
      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--secondary-bg)] flex-shrink-0 flex items-center justify-center">
        {imgFailed ? (
          <span className="flex items-center justify-center w-full h-full text-xs font-mono text-[var(--text-muted)]">
            {product.brand.slice(0, 2)}
          </span>
        ) : (
        <img
          src={getProductImageUrl(product.filename)}
          alt={product.name}
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={() => setImgFailed(true)}
        />
        )}
      </div>
      <div className="pr-2">
        <span className="block font-mono text-xs uppercase tracking-wider text-[var(--muted-teal)]">
          {product.brand}
        </span>
        <span className="block font-semibold text-sm text-[var(--text-primary)] whitespace-nowrap max-w-[220px] truncate">
          {product.name}
        </span>
        <span className="block font-mono text-xs text-[var(--text-muted)]">
          {product.sku}
        </span>
      </div>
      {product.availability === 'emergency' && (          <span className="px-2 py-0.5 text-xs font-mono uppercase tracking-wide bg-[rgba(186,45,11,0.12)] text-[var(--brick-ember)] border border-[var(--brick-border)] rounded-full flex-shrink-0">
          Urgent
        </span>
      )}
    </a>
  )
}

export function HeroProductMarquee({ products, direction = 'left', speed = 'normal' }: HeroProductMarqueeProps) {
  const animClass =
    direction === 'left'
      ? speed === 'slow'
        ? 'animate-marquee-left-slow'
        : 'animate-marquee-left'
      : 'animate-marquee-right'

  const doubled = [...products, ...products]

  return (
    <div className="marquee-fade-edges overflow-hidden py-2 w-full max-w-[100vw]">
      <div className={`product-marquee-track ${animClass}`}>
        {doubled.map((product, i) => (
          <MarqueeCard key={`${product.id}-${i}`} product={product} />
        ))}
      </div>
    </div>
  )
}
