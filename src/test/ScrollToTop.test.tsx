import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Link } from 'react-router-dom'
import { ScrollToTop } from '../components/layout/ScrollToTop'

describe('ScrollToTop', () => {
  beforeEach(() => {
    // jsdom does not implement window.scrollTo
    window.scrollTo = vi.fn()
  })

  function Harness() {
    return (
      <MemoryRouter initialEntries={['/en']}>
        <ScrollToTop />
        <Link to="/en/products">products</Link>
        <Link to="/en/products?category=pumps">same page</Link>
      </MemoryRouter>
    )
  }

  it('scrolls to top when navigating to a different route', () => {
    render(<Harness />)
    // Ignore the scroll triggered by the initial mount.
    vi.mocked(window.scrollTo).mockClear()

    fireEvent.click(screen.getByText('products'))

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('does not scroll when only the query string changes (in-page updates)', () => {
    render(<Harness />)
    vi.mocked(window.scrollTo).mockClear()

    fireEvent.click(screen.getByText('products')) // pathname change → scroll
    const callsAfterRouteChange = vi.mocked(window.scrollTo).mock.calls.length
    expect(callsAfterRouteChange).toBeGreaterThanOrEqual(1)

    fireEvent.click(screen.getByText('same page')) // same pathname, new search
    expect(vi.mocked(window.scrollTo).mock.calls.length).toBe(callsAfterRouteChange)
  })

  it('forces an instant jump instead of relying on the CSS smooth-scroll', () => {
    render(<Harness />)
    vi.mocked(window.scrollTo).mockClear()

    // The effect must override the global `scroll-behavior: smooth` while it
    // jumps, so the reset cannot be cancelled mid-flight by the route mount.
    fireEvent.click(screen.getByText('products'))
    expect(document.documentElement.style.scrollBehavior).toBe('')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
