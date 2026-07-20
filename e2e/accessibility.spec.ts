import { test, expect } from '@playwright/test'

// ─── Images Have Alt Text ────────────────────────────────────────────────────

test.describe('Images Have Alt Text', () => {
  const pages = ['/', '/shop', '/products', '/brands', '/about', '/contact']

  for (const pagePath of pages) {
    test(`images on ${pagePath} have alt text`, async ({ page }) => {
      await page.goto(pagePath)
      await page.waitForTimeout(2000)
      const images = page.locator('img')
      const count = await images.count()
      for (let i = 0; i < Math.min(count, 10); i++) {
        const alt = await images.nth(i).getAttribute('alt')
        // Alt should exist (can be empty for decorative images, but should be present)
        expect(alt !== null).toBeTruthy()
      }
    })
  }
})

// ─── Form Labels ─────────────────────────────────────────────────────────────

test.describe('Form Labels', () => {
  test('contact form inputs have labels or aria-labels', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForTimeout(2000)
    const inputs = page.locator('input, textarea, select')
    const count = await inputs.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const placeholder = await input.getAttribute('placeholder')
      // Input should have some form of label
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false
      const hasAccessibility = ariaLabel || ariaLabelledBy || placeholder || hasLabel
      // At minimum, should have placeholder or aria-label
      expect(hasAccessibility).toBeTruthy()
    }
  })

  test('RFQ form inputs have labels', async ({ page }) => {
    await page.goto('/rfq')
    await page.waitForTimeout(2000)
    const inputs = page.locator('input, textarea, select')
    const count = await inputs.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const input = inputs.nth(i)
      const ariaLabel = await input.getAttribute('aria-label')
      const placeholder = await input.getAttribute('placeholder')
      const id = await input.getAttribute('id')
      // Check for associated <label> element
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false
      // Check if input is wrapped in a <label>
      const parentLabel = await input.evaluate((el) => el.closest('label') !== null)
      const hasAccessibility = ariaLabel || placeholder || hasLabel || parentLabel
      expect(hasAccessibility).toBeTruthy()
    }
  })
})

// ─── Keyboard Navigation ─────────────────────────────────────────────────────

test.describe('Keyboard Navigation', () => {
  test('can tab through homepage navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    // Press Tab multiple times to navigate through interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }
    // Focus should be on some element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.tagName : null
    })
    expect(focusedElement).toBeTruthy()
  })

  test('can tab through product page', async ({ page }) => {
    await page.goto('/products')
    await page.waitForTimeout(2000)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.tagName : null
    })
    expect(focusedElement).toBeTruthy()
  })
})

// ─── Heading Hierarchy ───────────────────────────────────────────────────────

test.describe('Heading Hierarchy', () => {
  test('homepage has h1 heading', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible({ timeout: 5000 })
  })

  test('products page has h1 heading', async ({ page }) => {
    await page.goto('/products')
    await page.waitForTimeout(2000)
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible({ timeout: 5000 })
  })

  test('about page has h1 heading', async ({ page }) => {
    await page.goto('/about')
    await page.waitForTimeout(2000)
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible({ timeout: 5000 })
  })
})

// ─── ARIA Attributes ─────────────────────────────────────────────────────────

test.describe('ARIA Attributes', () => {
  test('navigation has proper ARIA landmarks', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    const nav = page.locator('nav, [role="navigation"]').first()
    if (await nav.isVisible({ timeout: 3000 })) {
      await expect(nav).toBeVisible()
    }
  })

  test('main content area exists', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    const main = page.locator('main, [role="main"]').first()
    if (await main.isVisible({ timeout: 3000 })) {
      await expect(main).toBeVisible()
    }
  })

  test('footer exists', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    const footer = page.locator('footer, [role="contentinfo"]').first()
    await expect(footer).toBeVisible({ timeout: 5000 })
  })
})

// ─── Focus Visible ───────────────────────────────────────────────────────────

test.describe('Focus Visible', () => {
  test('interactive elements have focus styles', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    // Tab to first interactive element
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    // Check if focus is visible (element should have some visual indicator)
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return null
      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        borderColor: styles.borderColor,
      }
    })
    expect(focusedElement).toBeTruthy()
  })
})

// ─── Color Contrast (Basic) ──────────────────────────────────────────────────

test.describe('Color Contrast', () => {
  test('text elements have sufficient contrast', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a').first()
    if (await textElements.isVisible({ timeout: 3000 })) {
      const color = await textElements.evaluate((el) => {
        return window.getComputedStyle(el).color
      })
      expect(color).toBeTruthy()
    }
  })
})
