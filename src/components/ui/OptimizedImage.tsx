interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
  sizes?: string
  optimized?: boolean
}

import { applyImageFallback } from '../../lib/utils'

/**
 * OptimizedImage renders a clean, high-performance <img> element.
 * Bypasses fragile <picture> type negotiation that can break in browsers or edge-case header caching.
 *
 * On error: applies a graceful fallback chain directly on the DOM element
 * (avoids React state re-render flicker):
 *   Cloudinary product URL → local deployed copy → placeholder → stop.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  className,
  onError,
  ...rest
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      className={className}
      onError={(e) => {
        applyImageFallback(e.currentTarget)
        if (onError) onError(e)
      }}
      {...rest}
    />
  )
}
