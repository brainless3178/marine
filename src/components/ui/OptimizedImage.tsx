import { useMemo } from 'react'

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image URL (e.g. "/images/product-001.jpg") */
  src: string
  /** Alt text */
  alt: string
  /** Width attribute for CLS prevention */
  width?: number
  /** Height attribute for CLS prevention */
  height?: number
  /** Whether to lazy load (default: true) */
  loading?: 'lazy' | 'eager'
  /** Whether to use async decoding (default: true) */
  decoding?: 'async' | 'sync' | 'auto'
  /** CSS sizes attribute hint for responsive images (default: "100vw") */
  sizes?: string
}

/** Responsive breakpoints where we generate resized variants */
const RESPONSIVE_WIDTHS = [400, 600, 800, 1200] as const

/**
 * Build srcSet string for a given format.
 * Example for src="/images/product-001.jpg", format="avif":
 *   "/images/product-001-400.avif 400w, /images/product-001-600.avif 600w, ..."
 */
function buildSrcSet(basePath: string, ext: string): string {
  const srcSetEntries: string[] = []

  for (const w of RESPONSIVE_WIDTHS) {
    const fileName = w === 1200
      ? `${basePath}.${ext}`
      : `${basePath}-${w}.${ext}`
    srcSetEntries.push(`${fileName} ${w}w`)
  }

  return srcSetEntries.join(', ')
}

/**
 * Derive responsive source info from a base image URL.
 */
function getResponsiveSources(src: string): {
  avifSrcSet: string
  webpSrcSet: string
  jpgSrcSet: string
} | null {
  const match = src.match(/^(\/images\/.+)\.(jpe?g|png)$/i)
  if (!match) return null
  const base = match[1]
  const ext = match[2].toLowerCase().startsWith('jpeg') ? 'jpg' : match[2].toLowerCase()

  return {
    avifSrcSet: buildSrcSet(base, 'avif'),
    webpSrcSet: buildSrcSet(base, 'webp'),
    jpgSrcSet: buildSrcSet(base, ext),
  }
}

/**
 * OptimizedImage renders a <picture> element with responsive srcSet and
 * AVIF → WebP → JPG format negotiation.
 *
 * Browsers pick:
 *   1. Best format (AVIF > WebP > JPG)
 *   2. Best size for the viewport (via srcSet + sizes)
 *
 * Usage:
 *   <OptimizedImage src="/images/product-001.jpg" alt="Product" width={400} height={300} />
 *   <OptimizedImage src="/images/product-001.jpg" alt="Product" sizes="(max-width: 640px) 50vw, 25vw" />
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  sizes = '100vw',
  className,
  ...rest
}: OptimizedImageProps) {
  const sources = useMemo(() => getResponsiveSources(src), [src])

  if (!sources) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        className={className}
        {...rest}
      />
    )
  }

  return (
    <picture>
      <source srcSet={sources.avifSrcSet} sizes={sizes} type="image/avif" />
      <source srcSet={sources.webpSrcSet} sizes={sizes} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
        className={className}
        {...rest}
      />
    </picture>
  )
}
