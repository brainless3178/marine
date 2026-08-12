import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Hero } from '../components/sections/Hero'

// The cobe globe needs a WebGL canvas — not available in jsdom. Render a
// lightweight stand-in so the Hero layout itself stays testable.
vi.mock('../components/ui/cobe-globe', () => ({
  Globe: () => <div data-testid="hero-globe" role="img" aria-label="Global shipping network" />,
}))

// The typewriter animates via timers; render the first phrase statically.
vi.mock('../components/ui/Typewriter', () => ({
  Typewriter: ({ phrases, className }: { phrases: string[]; className?: string }) => (
    <span data-testid="typewriter" className={className}>{phrases[0]}</span>
  ),
}))

function renderHero() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Hero />
    </MemoryRouter>,
  )
}

describe('Hero (global network globe)', () => {
  it('renders the headline with the typewriter phrase', () => {
    renderHero()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Trusted Marine Spare Parts.')
    expect(screen.getByTestId('typewriter')).toHaveTextContent('Delivered Worldwide.')
  })

  it('renders both CTA links to the shop and search', () => {
    renderHero()
    const shop = screen.getByRole('link', { name: /Shop Products/i })
    const search = screen.getByRole('link', { name: /Search Ship Spares/i })
    expect(shop.getAttribute('href')).toBe('/en/shop')
    expect(search.getAttribute('href')).toBe('/en/products?search=ship%20spares')
  })

  it('renders all four trust badges', () => {
    renderHero()
    for (const badge of ['Worldwide Shipping', 'Quality Assured', 'Buyer Arranged Export', 'RFQ Support']) {
      expect(screen.getByText(badge)).toBeTruthy()
    }
  })

  it('renders the global network globe', () => {
    renderHero()
    expect(screen.getByTestId('hero-globe')).toBeTruthy()
  })
})
