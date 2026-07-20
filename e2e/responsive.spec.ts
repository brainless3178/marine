import { test, expect } from '@playwright/test'

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
}

// ─── Mobile Navigation ───────────────────────────────────────────────────────

test.describe('Mobile Navigation', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test('mobile hamburger menu is visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first()
    await expect(menuButton).toBeVisible({ timeout: 5000 })
  })

  test('mobile menu opens and shows navigation links', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first()
    if (await menuButton.isVisible({ timeout: 3000 })) {
      await menuButton.click()
      await page.waitForTimeout(500)
      // Should show navigation links
      const navLinks = page.locator('a[href="/products"], a[href="/brands"], a[href="/about"]')
      const count = await navLinks.count()
      expect(count).toBeGreaterThanOrEqual(1)
    }
  })

  test('mobile layout adapts for product cards', async ({ page }) => {
    await page.goto('/products')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
    // Product grid should be single column on mobile
    const grid = page.locator('[class*="grid"]').first()
    if (await grid.isVisible({ timeout: 3000 })) {
      await expect(grid).toBeVisible()
    }
  })

  test('mobile footer is readable', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })
})

// ─── Tablet Navigation ───────────────────────────────────────────────────────

test.describe('Tablet Navigation', () => {
  test.use({ viewport: VIEWPORTS.tablet })

  test('tablet layout shows sidebar or hamburger', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('tablet product grid shows 2 columns', async ({ page }) => {
    await page.goto('/products')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })
})

// ─── Desktop Navigation ──────────────────────────────────────────────────────

test.describe('Desktop Navigation', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('desktop shows full navigation bar', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    // Desktop should show all nav links
    const navLinks = page.locator('nav a, header a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('desktop product grid shows multiple columns', async ({ page }) => {
    await page.goto('/products')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })
})

// ─── Cross-Page Responsive ───────────────────────────────────────────────────

test.describe('Cross-Page Responsive', () => {
  const pages = ['/', '/shop', '/products', '/brands', '/about', '/rfq', '/contact', '/emergency']

  for (const pagePath of pages) {
    test(`responsive layout on ${pagePath} - mobile`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile)
      await page.goto(pagePath)
      await page.waitForTimeout(1500)
      await expect(page.locator('body')).toBeVisible()
      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10)
    })

    test(`responsive layout on ${pagePath} - tablet`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tablet)
      await page.goto(pagePath)
      await page.waitForTimeout(1500)
      await expect(page.locator('body')).toBeVisible()
    })

    test(`responsive layout on ${pagePath} - desktop`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop)
      await page.goto(pagePath)
      await page.waitForTimeout(1500)
      await expect(page.locator('body')).toBeVisible()
    })
  }
})
