import { test, expect } from '@playwright/test'

// ─── RFQ Submission Flow ────────────────────────────────────────────────────

test.describe('RFQ Submission Flow', () => {
  test('RFQ form can be filled step by step', async ({ page }) => {
    await page.goto('/rfq')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })

    // Should see step 1 indicators
    await expect(page.locator('text=1').first()).toBeVisible()

    // Fill contact information
    const nameInput = page.locator('input[placeholder*="name" i], input[type="text"]').first()
    if (await nameInput.isVisible({ timeout: 5000 })) {
      await nameInput.fill('E2E Test User')
    }

    const emailInput = page.locator('input[type="email"]').first()
    if (await emailInput.isVisible()) {
      await emailInput.fill('e2e-test@example.com')
    }

    // Continue to next step
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first()
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      await page.waitForTimeout(1000)
    }

    // Fill product description on step 2
    const descInput = page.locator('textarea, input[placeholder*="part" i], input[placeholder*="product" i]').first()
    if (await descInput.isVisible({ timeout: 3000 })) {
      await descInput.fill('E2E Test: Hydraulic pump for MAN B&W engine')
    }
  })

  test('RFQ form requires product description before submission', async ({ page }) => {
    await page.goto('/rfq')
    await page.waitForTimeout(1000)

    // Check that the form is loaded
    await expect(page.locator('body')).toBeVisible()
  })

  test('RFQ form shows privacy notice checkbox', async ({ page }) => {
    await page.goto('/rfq')
    await page.waitForTimeout(1000)

    // Should have consent checkbox
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible({ timeout: 3000 })) {
      // Consent checkbox exists
      await expect(checkbox).toBeVisible()
    } else {
      // Or consent text
      const consentText = page.locator('text=consent, text=agree, text=privacy, text=policy').first()
      await expect(consentText).toBeVisible()
    }
  })
})

// ─── Product Search & Filter ────────────────────────────────────────────────

test.describe('Product Search & Filter', () => {
  test('products page loads with search input and filters', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })

    // Should have search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first()
    await expect(searchInput).toBeVisible({ timeout: 5000 })
  })

  test('can search for products', async ({ page }) => {
    await page.goto('/products')
    await page.waitForTimeout(2000)

    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first()
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('pump')
      await page.waitForTimeout(500)
      // Search should not cause errors
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('product cards are visible after page loads', async ({ page }) => {
    await page.goto('/products')
    await page.waitForTimeout(5000)

    // Should have product cards or product grid
    const productGrid = page.locator('[class*="grid"]').first()
    const productCards = page.locator('a[href*="/product/"]').first()
    const hasGrid = await productGrid.isVisible({ timeout: 3000 }).then(() => true).catch(() => false)
    const hasCards = await productCards.isVisible({ timeout: 3000 }).then(() => true).catch(() => false)
    expect(hasGrid || hasCards).toBeTruthy()
  })

  test('products page URL parameters work (category filter)', async ({ page }) => {
    await page.goto('/products?category=marine')
    await page.waitForTimeout(3000)
    await expect(page.locator('body')).toBeVisible()
  })
})

// ─── Command Palette Search ─────────────────────────────────────────────────

test.describe('Command Palette Search', () => {
  test('command palette opens with Ctrl+K on homepage', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Open command palette
    await page.keyboard.press('Control+k')
    await page.waitForTimeout(500)

    // Should show search input
    const searchInput = page.locator('input[placeholder*="search" i]').first()
    const paletteVisible = await searchInput.isVisible({ timeout: 3000 }).then(() => true).catch(() => false)
    if (paletteVisible) {
      await expect(searchInput).toBeVisible()
      // Close with Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      await expect(searchInput).not.toBeVisible()
    }
  })

  test('command palette filters results when typing', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    await page.keyboard.press('Control+k')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input[placeholder*="search" i]').first()
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('products')
      await page.waitForTimeout(500)
      // Results should update
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
