/**
 * Theme defaults shared across the storefront.
 *
 * The default theme is controlled by the VITE_DEFAULT_THEME env var
 * (values: "light" | "dark"). When unset, the storefront stays bright
 * (light) — buyers can still switch themes with the toggle.
 */

export const DEFAULT_THEME: 'dark' | 'light' =
  import.meta.env.VITE_DEFAULT_THEME === 'dark' ? 'dark' : 'light'

/**
 * Resolve the initial theme from localStorage, falling back to the
 * VITE_DEFAULT_THEME env default.
 *
 * Reads storage directly (not the DOM class) so the value is correct even
 * when the store module evaluates before main.tsx applies the .light/.dark
 * class to <html> (ESM imports are hoisted).
 */
export function resolveInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return DEFAULT_THEME
  const stored = localStorage.getItem('alka-theme')
  if (stored === 'dark' || stored === 'light') return stored
  return DEFAULT_THEME
}

/** Browser chrome colors (mobile address bar) matched to each theme. */
const THEME_COLOR: Record<'dark' | 'light', string> = {
  dark: '#0c2d48',
  light: '#f6f4ef',
}

/** Keep the <meta name="theme-color"> in sync with the active theme. */
export function syncThemeColor(theme: 'dark' | 'light') {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}
