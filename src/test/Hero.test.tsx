import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Hero } from '../components/sections/Hero'
import { useStore } from '../store/useStore'

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

/** Configurable window.matchMedia. min-width queries are fixed (desktop/tablet
 *  per jsdom's 1024px viewport); everything else comes from `overrides`. */
function installMatchMedia(overrides: Record<string, boolean> = {}) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => {
      let matches = false
      if (query === '(min-width: 1280px)') matches = false
      else if (query === '(min-width: 768px)') matches = true
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
  // The IO callback flips the hook's inView state — wrap in act() so React
  // flushes the update and mounts the <video> before assertions run.
  act(() => {
    observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
  })
}

beforeEach(() => {
  observerCallback = null
  installMatchMedia()
  setConnection(undefined)
  ;(globalThis as unknown as Record<string, unknown>).IntersectionObserver = MockIntersectionObserver
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  // Media layer renders in both themes; pin a stable theme for the assertions.
  useStore.setState({ theme: 'dark' })
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (globalThis as unknown as Record<string, unknown>).IntersectionObserver
  setConnection(undefined)
})

// ─── tests ─────────────────────────────────────────────────────────────────

describe('Hero', () => {
  it('renders the headline, CTAs, trust badges, and four feature cards', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    )

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Trusted Marine Spare Parts.')
    expect(heading).toHaveTextContent('Delivered Worldwide.')

    expect(screen.getByRole('link', { name: /shop products/i })).toHaveAttribute('href', '/en/shop')
    expect(screen.getByRole('link', { name: /search ship spares/i })).toHaveAttribute(
      'href',
      '/en/products?search=ship%20spares'
    )

    expect(screen.getByText('Quality Assured')).toBeTruthy()
    // 'Buyer Arranged Export' appears both as a trust badge and a feature card
    expect(screen.getAllByText('Buyer Arranged Export').length).toBeGreaterThanOrEqual(1)

    // Four feature cards
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('paints the poster immediately and defers the video until the hero is in view', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    )

    expect(screen.getByTestId('hero-poster')).toBeTruthy()
    expect(screen.queryByTestId('hero-video')).toBeNull()

    fireIntersect()

    const video = screen.getByTestId('hero-video') as HTMLVideoElement
    // jsdom viewport (1024px) → tablet source
    expect(video.getAttribute('src')).toContain('w_1280,c_limit')
  })

  it('never loads the video for prefers-reduced-motion users', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    )

    fireIntersect()
    expect(screen.queryByTestId('hero-video')).toBeNull()
    expect(screen.getByTestId('hero-poster')).toBeTruthy()
  })

  it('never loads the video when Save-Data is enabled', () => {
    setConnection({ saveData: true, effectiveType: '4g' })
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    )

    fireIntersect()
    expect(screen.queryByTestId('hero-video')).toBeNull()
    expect(screen.getByTestId('hero-poster')).toBeTruthy()
  })

  it('keeps the video in light mode with the warm-tint class', () => {
    useStore.setState({ theme: 'light' })
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    )

    const poster = screen.getByTestId('hero-poster') as HTMLImageElement
    expect(poster).toBeTruthy()
    expect(poster.className).toContain('hero-media')
    expect(screen.queryByTestId('hero-video')).toBeNull()

    fireIntersect()

    const video = screen.getByTestId('hero-video') as HTMLVideoElement
    expect(video.className).toContain('hero-media')
    // Content still renders in light mode
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Trusted Marine Spare Parts.')
  })

  it('shows the media layer in both light and dark themes', () => {
    useStore.setState({ theme: 'light' })
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    )
    fireIntersect()

    expect(screen.getByTestId('hero-poster')).toBeTruthy()
    expect(screen.getByTestId('hero-video')).toBeTruthy()

    act(() => useStore.setState({ theme: 'dark' }))
    expect(screen.getByTestId('hero-poster')).toBeTruthy()
    expect(screen.getByTestId('hero-video')).toBeTruthy()
  })
})
