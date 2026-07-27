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

/**
 * OptimizedImage renders a clean, high-performance <img> element.
 * Bypasses fragile <picture> type negotiation that can break in browsers or Netlify header edge cases.
 *
 * On error: replaces src directly on the DOM element (avoids React state re-render flicker).
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
        const img = e.currentTarget
        if (!img.src.includes('/images/placeholder.jpg')) {
          img.src = '/images/placeholder.jpg'
        }
        if (onError) onError(e)
      }}
      {...rest}
    />
  )
}
