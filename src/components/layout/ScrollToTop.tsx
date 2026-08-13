import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets the scroll position to the top on every route (pathname) change.
 *
 * React Router's BrowserRouter does not reset scroll on navigation, so clicking
 * a navbar/footer link while scrolled down (e.g. at the footer) would otherwise
 * open the next page mid-scroll.
 *
 * Why an instant, forced jump:
 * - `index.css` sets `scroll-behavior: smooth` on html. A plain
 *   `window.scrollTo(0, 0)` would animate — and that animation is cancelled
 *   mid-flight when the lazy route mounts (old page unmounts, new content
 *   grows the document), leaving the viewport stranded mid-page.
 * - Overriding the CSS behavior to `auto` around the call makes the jump
 *   synchronous in every browser (fallback for older Safari that ignores
 *   `behavior: 'instant'`).
 * - `history.scrollRestoration = 'manual'` stops the browser from re-scrolling
 *   on back/forward navigation.
 * - A `requestAnimationFrame` re-asserts the top after the new page paints,
 *   defeating any scroll-anchoring nudge during the content swap.
 *
 * Keyed on `pathname` only — in-page updates that only change the query string
 * (?category=…) keep the current scroll.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const root = document.documentElement
    const prevBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    root.style.scrollBehavior = prevBehavior

    const raf = requestAnimationFrame(() => {
      root.style.scrollBehavior = 'auto'
      window.scrollTo(0, 0)
      root.style.scrollBehavior = prevBehavior
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  return null
}

// Disable the browser's native scroll restoration for this SPA once, so
// back/forward navigation can't fight the scroll-to-top behavior.
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}
