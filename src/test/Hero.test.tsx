import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Hero } from '../components/sections/Hero'

// ─── mocks ────────────────────────────────────────────────────────────────

/** Configurable window.matchMedia — everything matches per `overrides`. */
function installMatchMedia(overrides: Record<string, boolean> = {}) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => {
      const matches = overrides[query] ?? false
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

function renderHero() {
  return render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>
  )
}

beforeEach(() => {
  installMatchMedia()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

// ─── tests ─────────────────────────────────────────────────────────────────

describe('Hero', () => {
  it('renders the headline, CTAs, and trust badges — no video or poster media', () => {
    renderHero()

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Trusted Marine Spare Parts.')

    expect(screen.getByRole('link', { name: /shop products/i })).toHaveAttribute('href', '/en/shop')
    expect(screen.getByRole('link', { name: /search ship spares/i })).toHaveAttribute(
      'href',
      '/en/products?search=ship%20spares'
    )

    expect(screen.getByText('Quality Assured')).toBeTruthy()
    expect(screen.getByText('Buyer Arranged Export')).toBeTruthy()

    // The old hero painted a poster/video background — it must be gone.
    expect(screen.queryByTestId('hero-poster')).toBeNull()
    expect(screen.queryByTestId('hero-video')).toBeNull()
  })

  it('types the first phrase character by character (typewriter effect)', () => {
    vi.useFakeTimers()
    renderHero()

    // The caret is rendered immediately, before typing begins.
    expect(screen.getByRole('heading', { level: 1 }).querySelector('.hero-typewriter-caret')).toBeTruthy()

    const display = screen.getByTestId('typewriter-display')
    // Before the start delay the typed line is empty.
    expect(display.textContent).toBe('')

    // Advance past startDelay (400ms) + typing (~55ms/char) — 5 chars in.
    act(() => {
      vi.advanceTimersByTime(400 + 55 * 4)
    })
    // "Delivered Worldwide." typed 5 characters in.
    expect(display.textContent).toBe('Deliv')

    // Remaining 15 chars at ~55ms each.
    act(() => {
      vi.advanceTimersByTime(55 * 15 + 10)
    })
    expect(display.textContent).toBe('Delivered Worldwide.')
  })

  it('shows the full first phrase immediately for prefers-reduced-motion users', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    vi.useFakeTimers()
    renderHero()

    // No animation: the full phrase is present even before timers advance.
    expect(screen.getByTestId('typewriter-display').textContent).toBe('Delivered Worldwide.')
  })

  it('exposes a stable full-phrase label to screen readers', () => {
    renderHero()

    // The sr-only span carries the full current phrase regardless of typing state.
    const srText = document.querySelector('.sr-only')
    expect(srText).toBeTruthy()
    expect(srText?.textContent).toContain('Delivered Worldwide.')
  })
})
