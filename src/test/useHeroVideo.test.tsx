import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useHeroVideo } from '../hooks/useHeroVideo'

// ─── mocks ────────────────────────────────────────────────────────────────

let observerCallback: IntersectionObserverCallback | null = null

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    observerCallback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

/** Install a configurable window.matchMedia. min-width queries are driven by
 *  `viewports`; everything else by `overrides` (e.g. prefers-reduced-motion). */
function installMatchMedia(
  viewports: { desktop?: boolean; tablet?: boolean } = {},
  overrides: Record<string, boolean> = {}
) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => {
      let matches = false
      if (query === '(min-width: 1280px)') matches = viewports.desktop ?? false
      else if (query === '(min-width: 768px)') matches = viewports.tablet ?? true
      else matches = overrides[query] ?? false
      return {
        get matches() {
          return matches
        },
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    }),
  })
}

function setConnection(conn: { saveData?: boolean; effectiveType?: string } | undefined) {
  if (conn === undefined) {
    delete (navigator as unknown as Record<string, unknown>).connection
  } else {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: conn })
  }
}

function fireIntersect() {
  // The IO callback triggers setInView(true) — wrap in act() so React flushes
  // the state update and mounts the <video> before assertions run.
  act(() => {
    observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
  })
}

function fireHidden(hidden: boolean) {
  act(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: hidden })
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

// ─── harness ───────────────────────────────────────────────────────────────

function Harness() {
  const { sectionRef, videoRef, showVideo, videoSrc, onVideoPlaying, onVideoError } = useHeroVideo()
  return (
    <div ref={sectionRef} data-testid="section">
      {showVideo && (
        <video
          ref={videoRef}
          src={videoSrc}
          data-testid="video"
          onPlaying={onVideoPlaying}
          onError={onVideoError}
        />
      )}
    </div>
  )
}

let playSpy: ReturnType<typeof vi.spyOn>
let pauseSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  observerCallback = null
  installMatchMedia()
  setConnection(undefined)
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  ;(globalThis as unknown as Record<string, unknown>).IntersectionObserver = MockIntersectionObserver
  playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
  pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (globalThis as unknown as Record<string, unknown>).IntersectionObserver
  setConnection(undefined)
})

// ─── tests ─────────────────────────────────────────────────────────────────

describe('useHeroVideo', () => {
  it('exposes a poster URL and responsive srcSet immediately', () => {
    const { result } = renderHook(() => useHeroVideo())
    expect(result.current.posterUrl).toContain('hero_apy76l.webp')
    expect(result.current.posterSrcSet.split(', ')).toHaveLength(3)
    expect(result.current.showVideo).toBe(false)
  })

  it('does not mount the video until the hero is on screen (lazy loading)', () => {
    render(<Harness />)
    expect(screen.queryByTestId('video')).toBeNull()

    fireIntersect()
    const video = screen.getByTestId('video') as HTMLVideoElement
    expect(video).toBeTruthy()
    // jsdom default viewport is 1024px → tablet source
    expect(video.getAttribute('src')).toContain('w_1280,c_limit')
  })

  it('respects prefers-reduced-motion: poster only, never loads the video', () => {
    installMatchMedia({}, { '(prefers-reduced-motion: reduce)': true })
    render(<Harness />)
    fireIntersect()
    expect(screen.queryByTestId('video')).toBeNull()
  })

  it('respects Save-Data mode: poster only', () => {
    setConnection({ saveData: true, effectiveType: '4g' })
    render(<Harness />)
    fireIntersect()
    expect(screen.queryByTestId('video')).toBeNull()
  })

  it('respects slow-2g / 2g connections: poster only', () => {
    setConnection({ effectiveType: '2g' })
    render(<Harness />)
    fireIntersect()
    expect(screen.queryByTestId('video')).toBeNull()
  })

  it('downscales to the mobile source on 3g connections', () => {
    setConnection({ effectiveType: '3g' })
    render(<Harness />)
    fireIntersect()
    const video = screen.getByTestId('video') as HTMLVideoElement
    expect(video.getAttribute('src')).toContain('w_720,c_limit')
  })

  it('pauses playback when the tab is hidden and resumes when visible', () => {
    render(<Harness />)
    fireIntersect()
    const video = screen.getByTestId('video') as HTMLVideoElement
    expect(playSpy).toHaveBeenCalledTimes(1)

    // Simulate that the video is actively playing, then hide the tab.
    Object.defineProperty(video, 'paused', { configurable: true, value: false })
    fireHidden(true)
    expect(pauseSpy).toHaveBeenCalled()

    // Bring the tab back — playback resumes.
    fireHidden(false)
    expect(playSpy).toHaveBeenCalledTimes(2)
  })

  it('falls back to the poster when the video errors', () => {
    render(<Harness />)
    fireIntersect()
    const video = screen.getByTestId('video')
    fireEvent.error(video)
    expect(screen.queryByTestId('video')).toBeNull()
  })
})
