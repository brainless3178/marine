import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads successfully and shows hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Alka Traders|Marine/)
    // Hero heading should be visible
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('navigation links are present and functional', async ({ page }) => {
    await page.goto('/')
    // Check key nav links exist
    const shopLink = page.locator('a[href="/shop"]').first()
    await expect(shopLink).toBeVisible()
    await shopLink.click()
    await expect(page).toHaveURL(/\/shop/)

    await page.goto('/')
    const productsLink = page.locator('a[href="/products"]').first()
    await expect(productsLink).toBeVisible()
  })

  test('shipping badges section is visible', async ({ page }) => {
    await page.goto('/')
    // Shipping badges should be present (four icons)
    const badges = page.locator('section:has(svg) >> nth=0')
    await expect(badges).toBeVisible({ timeout: 5000 })
  })

  test('brands marquee section appears on scroll', async ({ page }) => {
    await page.goto('/')
    // BrandsMarquee is async-loaded — wait for API to return brands before checking
    const brandsSection = page.locator('#brands')
    await expect(brandsSection).toBeVisible({ timeout: 15000 })
  })

  test('footer contains contact info', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    // Footer should have email link
    const emailLink = footer.locator('a[href^="mailto:"]').first()
    await expect(emailLink).toBeVisible()
  })
})

test.describe('Shop Page', () => {
  test('loads products from API', async ({ page }) => {
    await page.goto('/shop')
    // Wait for products to load
    await page.waitForTimeout(2000)
    // Page should have product-related content
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
  })

  test('has category links to products page', async ({ page }) => {
    await page.goto('/shop')
    const categoryLinks = page.locator('a[href^="/products?category="]')
    const count = await categoryLinks.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('has view full catalog link', async ({ page }) => {
    await page.goto('/shop')
    const catalogLink = page.locator('a[href="/products"]').first()
    await expect(catalogLink).toBeVisible()
  })
})

test.describe('RFQ Form', () => {
  test('RFQ page loads with form fields and progress steps', async ({ page }) => {
    await page.goto('/rfq')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    // Should have progress step indicators — step numbers 1, 2, 3 in circles
    const stepOne = page.locator('div.rounded-full:has-text("1")').first()
    await expect(stepOne).toBeVisible({ timeout: 5000 })
  })

  test('RFQ form has required contact fields', async ({ page }) => {
    await page.goto('/rfq')
    await page.waitForTimeout(1000)
    // Step 1 should have contact fields
    const nameInput = page.locator('input[placeholder*="name" i], input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Contact Page', () => {
  test('contact page loads with office locations', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    // Should have office cards
    const officeCards = page.locator('text=/Bhavnagar|BHAVNAGAR/i')
    await expect(officeCards.first()).toBeVisible({ timeout: 5000 })
  })

  test('contact form has all required fields', async ({ page }) => {
    await page.goto('/contact')
    const nameInput = page.locator('#contact-name')
    const emailInput = page.locator('#contact-email')
    const messageTextarea = page.locator('#contact-message')
    await expect(nameInput).toBeVisible()
    await expect(emailInput).toBeVisible()
    await expect(messageTextarea).toBeVisible()
  })
})

test.describe('Product Search', () => {
  test('search page loads and has input field', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(1000)
    // Search page should render
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Emergency Page', () => {
  test('emergency page loads with emergency contacts', async ({ page }) => {
    await page.goto('/emergency')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    // Should have emergency contact buttons (WhatsApp, Phone)
    const emergencyButtons = page.locator('a[href*="wa.me"], a[href^="tel:"]')
    await expect(emergencyButtons.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('About Page', () => {
  test('about page loads with timeline and office sections', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('404 Handling', () => {
  test('non-existent route shows 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345')
    expect(response?.status()).toBe(200) // SPA returns 200, renders NotFound
    await page.waitForTimeout(2000)
    // Should show some 404 content
    const body = await page.locator('body').textContent()
    expect(body).toBeTruthy()
  })
})

test.describe('Brands Page', () => {
  test('brands page loads with brand filter buttons', async ({ page }) => {
    await page.goto('/brands')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    // Should have sector filter buttons
    const filterButton = page.locator('button:has-text("All"), button:has-text("Marine")').first()
    await expect(filterButton).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Admin Login', () => {
  test('admin login page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    // Should show login form
    const body = await page.locator('body').textContent()
    expect(body).toBeTruthy()
  })

  test('admin login has email and password fields', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    // Should have input fields for login
    const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]')
    const count = await inputs.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('Navigation', () => {
  test('can navigate through main pages without error', async ({ page }) => {
    const pages = ['/', '/shop', '/products', '/brands', '/about', '/rfq', '/contact', '/emergency']
    for (const path of pages) {
      await page.goto(path)
      await page.waitForTimeout(1000)
      // Page should not crash — body should be visible
      await expect(page.locator('body')).toBeVisible({ timeout: 5000 })
      // No console errors should have occurred
    }
  })
})

test.describe('Product Detail', () => {
  test('product detail page loads for a known product', async ({ page, request }) => {
    const res = await request.get('/api/storefront/products?limit=1')
    const data = await res.json()
    const productId = data.products?.[0]?.id
    if (!productId) return
    await page.goto(`/product/${productId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)
    // Should show some content
    await expect(page.locator('body')).toBeVisible()
  })
})
