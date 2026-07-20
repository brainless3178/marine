/**
 * Shared utility functions for Alka Traders.
 */

/**
 * Determine whether a hex color is "light" (needs dark text) or "dark" (needs light text).
 * Uses the W3C relative luminance formula.
 *
 * @param hex - A hex color string, e.g. "#159a67" or "159a67"
 * @returns true if the color is light (use dark text), false if dark (use light text)
 */
export function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '')
  if (clean.length < 3) return false
  // Expand 3-char hex to 6-char
  const hex6 = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const r = parseInt(hex6.slice(0, 2), 16) / 255
  const g = parseInt(hex6.slice(2, 4), 16) / 255
  const b = parseInt(hex6.slice(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return luminance > 0.179 // threshold per WCAG
}
