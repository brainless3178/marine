import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getHeroHlsUrl,
  getHeroPosterSrcSet,
  getHeroPosterUrl,
  getHeroVideoUrl,
  supportsNativeHls,
  type HeroVideoSize,
} from '@/lib/cloudinaryVideo'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const DESKTOP_QUERY = '(min-width: 1280px)'
const TABLET_QUERY = '(min-width: 768px)'

/**
 * How long after the hero enters the viewport we wait before starting the
 * video fetch. The hero is on screen at page load, so without this the video
 * (multi-MB at w_720+) competes with the LCP poster + webfonts for the
 * connection. The poster covers the hero meanwhile, so the fade-in a moment
 * later is imperceptible — but LCP is measurably faster on real networks.
 */
export const VIDEO_LOAD_DEFER_MS = 2000

/** Map the current viewport to the closest hero video size bucket. */
function getViewportSize(): HeroVideoSize {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia(DESKTOP_QUERY).matches) return 'desktop'
  if (window.matchMedia(TABLET_QUERY).matches) return 'tablet'
  return 'mobile'
}

interface ConnectionInfo {
  saveData?: boolean
  effectiveType?: string
}

/** Network Information API — missing in Firefox, so it's optional everywhere. */
function getConnectionInfo(): ConnectionInfo {
  if (typeof navigator === 'undefined') return {}
  return (navigator as Navigator & { connection?: ConnectionInfo }).connection ?? {}
}

/**
 * Reactive media-query state (used for prefers-reduced-motion), so a change
 * while the page is open is picked up without polling.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  )
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [query])
  return matches
}

/** navigator.userAgent never changes per session — decide once. */
const USE_NATIVE_HLS = typeof navigator !== 'undefined' ? supportsNativeHls(navigator.userAgent) : false

/**
 * Performance-first hero video orchestration:
 *
 * - Lazy-loads the video only after the hero enters the viewport
 *   (Intersection Observer) — the first paint is never blocked by the video.
 * - Skips the video entirely for prefers-reduced-motion, Save-Data or
 *   slow-2g/2g connections: the static poster is shown instead.
 * - Downscales to the mobile source on 3g connections.
 * - Switches between 720 / 1280 / 1920px sources at viewport breakpoints via
 *   matchMedia listeners (no resize+debounce churn).
 * - Hands Safari/iOS an adaptive HLS manifest (native support); other
 *   browsers get a fixed-resolution progressive file.
 * - Pauses playback when the tab is hidden and resumes when it's visible.
 * - Uses refs + one-shot state transitions so re-renders stay minimal.
 */
export function useHeroVideo() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const wasPlayingBeforeHiddenRef = useRef(false)

  const [inView, setInView] = useState(false)
  const [size, setSize] = useState<HeroVideoSize>(() => getViewportSize())
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  const { saveData, effectiveType } = getConnectionInfo()
  const slowNetwork = saveData === true || effectiveType === 'slow-2g' || effectiveType === '2g'
  const lowPower3g = effectiveType === '3g'

  const shouldLoadVideo = inView && !prefersReducedMotion && !slowNetwork && !videoFailed
  const resolvedSize: HeroVideoSize = lowPower3g ? 'mobile' : size

  // Re-evaluate the size bucket only when the viewport crosses a breakpoint.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const tablet = window.matchMedia(TABLET_QUERY)
    const update = () => setSize(getViewportSize())
    desktop.addEventListener?.('change', update)
    tablet.addEventListener?.('change', update)
    return () => {
      desktop.removeEventListener?.('change', update)
      tablet.removeEventListener?.('change', update)
    }
  }, [])

  // Defer the video until the hero is actually on screen.
  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    let deferTimer: number | undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          // Defer the heavy video fetch until LCP resources have won the
          // connection (see VIDEO_LOAD_DEFER_MS above). If the tab is
          // backgrounded before the timer fires, skip the load entirely — the
          // poster covers the hero and the visibilitychange handler can't
          // pause a video that mounts while hidden.
          deferTimer = window.setTimeout(() => {
            if (!document.hidden) setInView(true)
          }, VIDEO_LOAD_DEFER_MS)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px', threshold: 0.05 }
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      // If the component unmounts before the deferred timer fires, cancel it
      // so the video never mounts after the hero is gone.
      if (deferTimer !== undefined) window.clearTimeout(deferTimer)
    }
  }, [])

  const videoSrc = shouldLoadVideo ? (USE_NATIVE_HLS ? getHeroHlsUrl() : getHeroVideoUrl(resolvedSize)) : ''

  // Start playback once the video mounts; pause and reset if the gate flips
  // off (e.g. the video errors out and we fall back to the poster).
  useEffect(() => {
    if (!shouldLoadVideo) {
      wasPlayingBeforeHiddenRef.current = false
      setIsPlaying(false)
      if (videoRef.current) videoRef.current.pause()
      return
    }
    const video = videoRef.current
    if (!video) return
    // The element is declared with preload="metadata" so nothing is fetched
    // before the hero is visible; once visible we let it buffer eagerly.
    video.preload = 'auto'
    const promise = video.play()
    if (promise) promise.catch(() => {
      /* autoplay rejected (e.g. low-power mode) — poster remains visible */
    })
  }, [shouldLoadVideo, videoSrc])

  // Pause when the tab is hidden; resume only if it was playing before.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !shouldLoadVideo) return
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasPlayingBeforeHiddenRef.current = !video.paused
        if (!video.paused) video.pause()
      } else if (wasPlayingBeforeHiddenRef.current) {
        wasPlayingBeforeHiddenRef.current = false
        const promise = video.play()
        if (promise) promise.catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [shouldLoadVideo])

  // Stable handlers so the memoized background component never re-renders
  // for the ~17 fps typewriter ticks in <Hero />.
  const onVideoPlaying = useCallback(() => setIsPlaying(true), [])
  const onVideoError = useCallback(() => setVideoFailed(true), [])

  return {
    sectionRef,
    videoRef,
    /** true → the <video> element may be mounted (still gated by reduced-motion / slow network). */
    showVideo: shouldLoadVideo,
    /** true once the video is actually playing (drives the fade-in over the poster). */
    isPlaying,
    videoSrc,
    posterUrl: getHeroPosterUrl(size),
    posterSrcSet: getHeroPosterSrcSet(),
    onVideoPlaying,
    onVideoError,
  }
}
