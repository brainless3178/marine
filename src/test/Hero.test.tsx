import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Hero } from '../components/sections/Hero'

// ─── mocks ────────────────────────────────────────────────────────────────

function renderHero() {
  return render(<Hero />)
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

// ─── tests ─────────────────────────────────────────────────────────────────

describe('Hero (image slider)', () => {
  it('renders a 3-slide carousel with the first slide active', () => {
    renderHero()

    const slides = screen.getAllByRole('group', { hidden: true })
    expect(slides).toHaveLength(3)

    // First slide visible, others hidden
    expect(slides[0]).toHaveAttribute('aria-hidden', 'false')
    expect(slides[1]).toHaveAttribute('aria-hidden', 'true')
    expect(slides[2]).toHaveAttribute('aria-hidden', 'true')

    // Slide counter
    expect(screen.getByText('01 / 03')).toBeTruthy()

    // Three images with descriptive alt text
    expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(3)
  })

  it('moves to the next and previous slide via the arrow buttons', () => {
    renderHero()

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }))
    expect(screen.getByText('02 / 03')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }))
    expect(screen.getByText('03 / 03')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }))
    // wraps back to the first slide
    expect(screen.getByText('01 / 03')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }))
    expect(screen.getByText('03 / 03')).toBeTruthy()
  })

  it('jumps to a specific slide via the dots', () => {
    renderHero()

    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }))
    expect(screen.getByText('03 / 03')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 2' }))
    expect(screen.getByText('02 / 03')).toBeTruthy()
  })

  it('auto-rotates every 5 seconds', () => {
    renderHero()
    expect(screen.getByText('01 / 03')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText('02 / 03')).toBeTruthy()
  })

  it('supports keyboard arrow navigation', () => {
    renderHero()

    const region = screen.getByRole('region')
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    expect(screen.getByText('02 / 03')).toBeTruthy()

    fireEvent.keyDown(region, { key: 'ArrowLeft' })
    expect(screen.getByText('01 / 03')).toBeTruthy()
  })

  it('renders no video or poster media (image slider only)', () => {
    renderHero()

    expect(screen.queryByTestId('hero-poster')).toBeNull()
    expect(screen.queryByTestId('hero-video')).toBeNull()
  })
})
