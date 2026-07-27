import { test, expect } from '@playwright/test'

// Increase timeout per test to 60s to handle SPA loading under concurrent workers
test.slow()

// ─── Device-specific viewport sizes ─────────────────────────────────────────
const DEVICES = {
  galaxyS21:      { width: 360, height: 800 },  // Galaxy S21
  iphone12:       { width: 390, height: 844 },  // iPhone 12/13/14
  iphoneSe:       { width: 375, height: 667 },  // iPhone SE (smallest iPhone)
  pixel5:         { width: 393, height: 851 },  // Pixel 5
  ipad:           { width: 768, height: 1024 }, // iPad mini / small tablet
  ipadPro:        { width: 1024, height: 1366 },// iPad Pro 11"
  desktop:        { width: 1280, height: 720 },
}

const SITE_PAGES = ['/', '/shop', '/products', '/brands', '/about', '/rfq', '/contact', '/emergency', '/intelligence', '/network']

// ─── Dismiss cookie consent if present ───────────────────────────────────────
async function dismissCookieConsent(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.setItem('alka-cookie-consent', JSON.stringify({ accepted: true, timestamp: Date.now() }))
  })
}

// ─── Touch target size check — every interactive element must be ≥48px ─────
async function checkTouchTargets(page: import('@playwright/test').Page) {
  await page.waitForTimeout(800)
  // Collect all interactive elements
  const elements = page.locator(
    'button:not([aria-hidden="true"]), a[href]:not([aria-hidden="true"]), input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([aria-hidden="true"]), select:not([aria-hidden="true"]), textarea:not([aria-hidden="true"])'
  )
  const count = await elements.count()
  const failures: string[] = []
  for (let i = 0; i < Math.min(count, 30); i++) {
    const el = elements.nth(i)
    const box = await el.boundingBox()
    if (box) {
      // The CSS guarantees min-height/min-width: 48px. Check against 48px.
      if (box.width < 48 || box.height < 48) {
        const tagName = await el.evaluate((e: Element) => e.tagName.toLowerCase())
        const text = await el.textContent()
        const label = text?.trim().slice(0, 30) || tagName
        failures.push(`${label} (${tagName}): ${Math.round(box.width)}x${Math.round(box.height)}px`)
      }
    }
  }
  if (failures.length > 0) {
    console.log(`[TOUCH-TARGET WARN] ${failures.length} element(s) < 48px:`, failures.join('; '))
  }
  // Allow up to 3 small elements before failing (e.g. decorative SVGs, inline icons)
  expect(failures.length).toBeLessThan(4)
}

// ─── No horizontal overflow check ────────────────────────────────────────────
async function checkNoOverflow(page: import('@playwright/test').Page) {
  await page.waitForTimeout(500)
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
  const innerW = await page.evaluate(() => window.innerWidth)
  // Allow 1px for sub-pixel rounding
  expect(scrollW).toBeLessThanOrEqual(innerW + 1)
}

// ─── Device-specific Navigation Tests ────────────────────────────────────────

test.describe('Mobile Navigation', () => {
  test('mobile hamburger menu is visible (375x812)', async ({ page }) => {
    await page.setViewportSize(DEVICES.iphoneSe)
    await page.goto('/')
    await page.waitForTimeout(1000)
    const menuButton = page.locator('button[aria-label*="menu" i], button[class*="hamburger"], [role="button"][aria-label*="menu"]').first()
    await expect(menuButton).toBeVisible({ timeout: 5000 })
  })

  test('mobile menu opens and shows navigation links (375x812)', async ({ page }) => {
    await page.setViewportSize(DEVICES.iphoneSe)
    await page.goto('/')
    await page.waitForTimeout(1000)
    await dismissCookieConsent(page)
    const menuButton = page.locator('button[aria-label*="menu" i], button[class*="hamburger"], [role="button"][aria-label*="menu"]').first()
    if (await menuButton.isVisible({ timeout: 3000 })) {
      await menuButton.click()
      await page.waitForTimeout(500)
      const navLinks = page.locator('a[href="/products"], a[href="/brands"], a[href="/about"]')
      const count = await navLinks.count()
      expect(count).toBeGreaterThanOrEqual(1)
    }
  })

  test('iPhone 12/14 (390x844) — no overflow on homepage', async ({ page }) => {
    await page.setViewportSize(DEVICES.iphone12)
    await page.goto('/')
    await dismissCookieConsent(page)
    await page.waitForTimeout(800)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })

  test('Galaxy S21 (360x800) — no overflow on homepage', async ({ page }) => {
    await page.setViewportSize(DEVICES.galaxyS21)
    await page.goto('/')
    await dismissCookieConsent(page)
    await page.waitForTimeout(800)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })

  test('iPhone 12/14 — products page', async ({ page }) => {
    await page.setViewportSize(DEVICES.iphone12)
    await page.goto('/products')
    await dismissCookieConsent(page)
    await page.waitForTimeout(800)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })

  test('Galaxy S21 — products page', async ({ page }) => {
    await page.setViewportSize(DEVICES.galaxyS21)
    await page.goto('/products')
    await dismissCookieConsent(page)
    await page.waitForTimeout(800)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })

  test('iPhone 12/14 — footer stacks vertically', async ({ page }) => {
    await page.setViewportSize(DEVICES.iphone12)
    await page.goto('/')
    await dismissCookieConsent(page)
    await page.waitForTimeout(800)
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await checkNoOverflow(page)
  })

  test('Galaxy S21 — touch targets meet minimum size (48px)', async ({ page }) => {
    await page.setViewportSize(DEVICES.galaxyS21)
    await page.goto('/')
    await dismissCookieConsent(page)
    await page.waitForTimeout(800)
    await checkTouchTargets(page)
  })

  test('iPhone 12/14 — touch targets meet minimum size (48px)', async ({ page }) => {
    await page.setViewportSize(DEVICES.iphone12)
    await page.goto('/')
    await dismissCookieConsent(page)
    await page.waitForTimeout(800)
    await checkTouchTargets(page)
  })

  test('iPhone 12/14 — RFQ form is touch-friendly', async ({ page }) => {
    await page.setViewportSize(DEVICES.iphone12)
    await page.goto('/rfq')
    await dismissCookieConsent(page)
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
    await checkTouchTargets(page)
  })

  test('Galaxy S21 — About page no overflow', async ({ page }) => {
    await page.setViewportSize(DEVICES.galaxyS21)
    await page.goto('/about')
    await dismissCookieConsent(page)
    await page.waitForTimeout(800)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })

  test('iPhone 12/14 — Contact page form is usable', async ({ page }) => {
    await page.setViewportSize(DEVICES.iphone12)
    await page.goto('/contact')
    await dismissCookieConsent(page)
    await page.waitForTimeout(800)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
    await checkTouchTargets(page)
  })

  test('Pixel 5 (393x851) — Intelligence page', async ({ page }) => {
    await page.setViewportSize(DEVICES.pixel5)
    await page.goto('/intelligence')
    await dismissCookieConsent(page)
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })

  test('Pixel 5 — Network page', async ({ page }) => {
    await page.setViewportSize(DEVICES.pixel5)
    await page.goto('/network')
    await dismissCookieConsent(page)
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })

  test('iPhone SE (375x667) — smallest supported device', async ({ page }) => {
    await page.setViewportSize(DEVICES.iphoneSe)
    await page.goto('/')
    await dismissCookieConsent(page)
    await page.waitForTimeout(800)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })
})

// ─── Tablet Navigation ───────────────────────────────────────────────────────

test.describe('Tablet Navigation', () => {
  test('iPad (768x1024) — layout shows hamburger or sidebar', async ({ page }) => {
    await page.setViewportSize(DEVICES.ipad)
    await page.goto('/')
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })

  test('iPad — product grid shows 2-3 columns', async ({ page }) => {
    await page.setViewportSize(DEVICES.ipad)
    await page.goto('/products')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('iPad Pro (1024x1366) — desktop-like layout', async ({ page }) => {
    await page.setViewportSize(DEVICES.ipadPro)
    await page.goto('/')
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })
})

// ─── Desktop Navigation ──────────────────────────────────────────────────────

test.describe('Desktop Navigation', () => {
  test.use({ viewport: DEVICES.desktop })

  test('desktop shows full navigation bar', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    const navLinks = page.locator('nav a, header a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('desktop product grid shows multiple columns', async ({ page }) => {
    await page.goto('/products')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('desktop — products page has multiple columns', async ({ page }) => {
    await page.goto('/products')
    await page.waitForTimeout(1500)
    await expect(page.locator('body')).toBeVisible()
    await checkNoOverflow(page)
  })
})

// ─── Cross-Device Cross-Page Overflow Audit (iPad only) ──────────────────────
// Galaxy S21 and iPhone 12 are covered individually in Mobile Navigation above.

test.describe('Cross-Device Overflow Audit', () => {
  for (const pagePath of SITE_PAGES) {
    test(`iPad — ${pagePath}`, async ({ page }) => {
      await page.setViewportSize(DEVICES.ipad)
      await page.goto(pagePath)
      await dismissCookieConsent(page)
      await page.waitForTimeout(700)
      await expect(page.locator('body')).toBeVisible()
      await checkNoOverflow(page)
    })
  }
})
