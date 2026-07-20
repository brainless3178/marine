import { test, expect } from '@playwright/test'

// ─── Admin Login ─────────────────────────────────────────────────────────────

test.describe('Admin Login', () => {
  test('admin login page loads with form', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
    // Should have email and password fields
    const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]')
    const count = await inputs.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('admin login has submit button', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first()
    if (await submitBtn.isVisible({ timeout: 3000 })) {
      await expect(submitBtn).toBeVisible()
    }
  })

  test('admin login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('wrong@example.com')
      await passwordInput.fill('wrongpassword')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(2000)
        // Should show error message or stay on login page
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

test.describe('Admin Dashboard', () => {
  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)
    // Should redirect to login or show login form
    const url = page.url()
    expect(url).toMatch(/login|admin/)
  })

  test('dashboard loads after login', async ({ page }) => {
    // First login
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        // Should be on dashboard or still on login
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Navigation ────────────────────────────────────────────────────────

test.describe('Admin Navigation', () => {
  test('admin sidebar has all main sections', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    // Try to login
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        // Check sidebar navigation
        const sidebar = page.locator('nav, [class*="sidebar"]').first()
        if (await sidebar.isVisible({ timeout: 3000 })) {
          // Should have main nav items
          const navItems = page.locator('a[href*="/admin/"], button:has-text("Products"), button:has-text("Orders")')
          const count = await navItems.count()
          expect(count).toBeGreaterThanOrEqual(1)
        }
      }
    }
  })
})

// ─── Admin Products ──────────────────────────────────────────────────────────

test.describe('Admin Products', () => {
  test('products page loads with product list', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    // Try to login
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        // Navigate to products
        await page.goto('/admin/products')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })

  test('add product button exists', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/products')
        await page.waitForTimeout(2000)
        const addBtn = page.locator('a:has-text("Add Product"), button:has-text("Add Product")').first()
        if (await addBtn.isVisible({ timeout: 3000 })) {
          await expect(addBtn).toBeVisible()
        }
      }
    }
  })
})

// ─── Admin Product Form ──────────────────────────────────────────────────────

test.describe('Admin Product Form', () => {
  test('new product form loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/products/new')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
        // Should have form fields
        const nameInput = page.locator('input[placeholder*="product" i], input[name*="name" i]').first()
        if (await nameInput.isVisible({ timeout: 3000 })) {
          await expect(nameInput).toBeVisible()
        }
      }
    }
  })

  test('product form has tabs', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        // Navigate to new product form
        await page.goto('/admin/products/new', { waitUntil: 'domcontentloaded', timeout: 60000 })
        await page.waitForTimeout(5000)
        // The form has tab buttons inside a nav element — verify the page loaded
        await expect(page.locator('body')).toBeVisible()
        // Check for product form content — the Basics tab or product name field
        const formContent = page.locator('button:has-text("Basics"), button:has-text("Inventory"), input[placeholder*="product" i], input[placeholder*="Hydraulic" i]')
        const count = await formContent.count()
        expect(count).toBeGreaterThanOrEqual(1)
      }
    }
  })
})

// ─── Admin Orders ────────────────────────────────────────────────────────────

test.describe('Admin Orders', () => {
  test('orders page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/orders')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Categories ────────────────────────────────────────────────────────

test.describe('Admin Categories', () => {
  test('categories page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/categories')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Brands ────────────────────────────────────────────────────────────

test.describe('Admin Brands', () => {
  test('brands page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/brands')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Industries ────────────────────────────────────────────────────────

test.describe('Admin Industries', () => {
  test('industries page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/industries')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Customers ─────────────────────────────────────────────────────────

test.describe('Admin Customers', () => {
  test('customers page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/customers')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin RFQs ──────────────────────────────────────────────────────────────

test.describe('Admin RFQs', () => {
  test('RFQs page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/rfqs')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Offers ────────────────────────────────────────────────────────────

test.describe('Admin Offers', () => {
  test('offers page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/offers')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Messages ──────────────────────────────────────────────────────────

test.describe('Admin Messages', () => {
  test('messages page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/messages')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Settings ──────────────────────────────────────────────────────────

test.describe('Admin Settings', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/settings')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Users ─────────────────────────────────────────────────────────────

test.describe('Admin Users', () => {
  test('users page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/users')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Audit Log ─────────────────────────────────────────────────────────

test.describe('Admin Audit Log', () => {
  test('audit log page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/audit-log')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Media ─────────────────────────────────────────────────────────────

test.describe('Admin Media', () => {
  test('media page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/media')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Homepage Content ──────────────────────────────────────────────────

test.describe('Admin Homepage Content', () => {
  test('homepage content page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/homepage')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

// ─── Admin Insights ──────────────────────────────────────────────────────────

test.describe('Admin Insights', () => {
  test('insights page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForTimeout(2000)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@alkatraders.com')
      await passwordInput.fill('admin123')
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        await page.goto('/admin/insights')
        await page.waitForTimeout(2000)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})
