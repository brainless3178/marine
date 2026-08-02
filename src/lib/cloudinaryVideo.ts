/**
 * Cloudinary URL helpers for the hero background video.
 *
 * The hero video is served through Cloudinary's on-the-fly delivery pipeline so
 * the original (≈90 MB) asset is NEVER sent to the browser. Every request is
 * transformed at the CDN: adaptive quality, negotiated container/codec, audio
 * stripped, and width-limited to the device's breakpoint — typically shrinking
 * the payload to a few MB while keeping the frame sharp.
 */

/** Cloudinary cloud name for Alka Traders assets. */
export const CLOUDINARY_CLOUD_NAME = 'y7up4zti'

/** Public id of the hero video asset in the Cloudinary Media Library. */
export const HERO_VIDEO_PUBLIC_ID = 'hero_apy76l'

/**
 * Delivery widths per viewport class:
 * - mobile:  720px  (phones — smallest payload)
 * - tablet:  1280px (tablets / small laptops)
 * - desktop: 1920px (large screens; c_limit never upscales the source)
 */
export const HERO_VIDEO_BREAKPOINTS = {
  mobile: 720,
  tablet: 1280,
  desktop: 1920,
} as const

export type HeroVideoSize = keyof typeof HERO_VIDEO_BREAKPOINTS

/**
 * Poster frame offset (seconds). Tune this to a frame of the video that looks
 * good as a static hero (avoids a black or blank first frame).
 */
export const HERO_POSTER_OFFSET_SECONDS = 1

const VIDEO_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload`

function resolveWidth(size: HeroVideoSize | number): number {
  return typeof size === 'number' ? size : HERO_VIDEO_BREAKPOINTS[size]
}

/**
 * Optimized progressive video URL for native `<video>` playback.
 *
 * Transformations (applied server-side by Cloudinary):
 * - q_auto          → per-frame adaptive quality (biggest byte win)
 * - f_auto          → best container for the requesting browser
 * - vc_auto         → best codec the browser supports (H.264 / HEVC / VP9 / AV1)
 * - ac_none         → strips the audio track at the CDN (saves ~10–15% bytes)
 * - w_<w>,c_limit   → scales to the target width; c_limit never upscales
 *
 * NOTE: use `ac_none`, not `adu` — Cloudinary rejects `adu` (404), which
 * silently killed hero playback (the video's onError fired and fell back to
 * the poster).
 */
export function getHeroVideoUrl(size: HeroVideoSize | number = 'desktop'): string {
  const width = resolveWidth(size)
  return `${VIDEO_BASE}/q_auto,f_auto,vc_auto,ac_none,w_${width},c_limit/${HERO_VIDEO_PUBLIC_ID}.mp4`
}

/**
 * Adaptive bitrate HLS manifest URL — "automatic streaming optimization".
 *
 * Cloudinary's `sp_auto` streaming profile derives multiple bitrate renditions
 * from the source and returns an HLS master playlist. Safari and iOS play HLS
 * natively; other browsers need hls.js. Use `supportsNativeHls()` to decide
 * when to hand this manifest to the `<video>` element.
 *
 * NOTE: do NOT add `fl_streaming` back — Cloudinary returns 400 when it's
 * combined with `sp_auto` on this asset; `sp_auto` alone already emits the
 * master playlist.
 */
export function getHeroHlsUrl(): string {
  return `${VIDEO_BASE}/sp_auto/${HERO_VIDEO_PUBLIC_ID}.m3u8`
}

/**
 * True when the browser can play HLS natively (Safari / iOS), so we can hand
 * it the adaptive manifest instead of a fixed-resolution progressive file.
 */
export function supportsNativeHls(userAgent: string): boolean {
  return /^((?!chrome|crios|fxios|firefox|edg|opr|android).)*safari/i.test(userAgent)
}

/**
 * High-quality WebP poster frame for the hero.
 *
 * Cloudinary renders a frame of the video (`so_<seconds>`) and encodes it as
 * WebP with `q_auto:good` — a sharp, small poster that paints instantly while
 * the video is still lazy-loading. If WebP extraction is ever unavailable, the
 * caller can fall back to `getHeroPosterJpgUrl()`.
 */
export function getHeroPosterUrl(size: HeroVideoSize | number = 'desktop'): string {
  const width = resolveWidth(size)
  return `${VIDEO_BASE}/q_auto:good,w_${width},c_limit,so_${HERO_POSTER_OFFSET_SECONDS}/${HERO_VIDEO_PUBLIC_ID}.webp`
}

/** Same poster frame encoded as JPEG — broadest compatibility fallback. */
export function getHeroPosterJpgUrl(size: HeroVideoSize | number = 'desktop'): string {
  return getHeroPosterUrl(size).replace('.webp', '.jpg')
}

/** Responsive srcSet for the poster: 720w, 1280w, 1920w (smallest first). */
export function getHeroPosterSrcSet(): string {
  return (Object.keys(HERO_VIDEO_BREAKPOINTS) as HeroVideoSize[])
    .map((size) => `${getHeroPosterUrl(size)} ${HERO_VIDEO_BREAKPOINTS[size]}w`)
    .join(', ')
}
