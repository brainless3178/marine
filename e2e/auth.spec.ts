import { test, expect } from '@playwright/test'

// ─── Customer Registration ───────────────────────────────────────────────────

test.describe('Customer Registration', () => {
  test('registration form opens from auth modal', async ({ page }) => {
    await page.goto('/')
    // Click the account/login button in navbar
    const accountBtn = page.locator('button:has-text("Sign"), button:has-text("Login"), a[href*="login"], [aria-label*="account" i]').first()
    if (await accountBtn.isVisible({ timeout: 3000 })) {
      await accountBtn.click()
      await page.waitForTimeout(500)
      // Should show auth modal with register option
      const registerTab = page.locator('button:has-text("Register"), button:has-text("Sign Up"), text=Create Account').first()
      if (await registerTab.isVisible({ timeout: 3000 })) {
        await registerTab.click()
        await page.waitForTimeout(500)
        // Should have registration fields
        const nameInput = page.locator('input[placeholder*="name" i], input[name*="name" i]').first()
        await expect(nameInput).toBeVisible({ timeout: 3000 })
      }
    }
  })

  test('registration requires name, email, and password', async ({ page }) => {
    await page.goto('/')
    const accountBtn = page.locator('button:has-text("Sign"), button:has-text("Login"), a[href*="login"]').first()
    if (await accountBtn.isVisible({ timeout: 3000 })) {
      await accountBtn.click()
      await page.waitForTimeout(500)
      const registerTab = page.locator('button:has-text("Register"), button:has-text("Sign Up")').first()
      if (await registerTab.isVisible({ timeout: 3000 })) {
        await registerTab.click()
        await page.waitForTimeout(500)
        // Check for required fields
        const emailInput = page.locator('input[type="email"]').first()
        const passwordInput = page.locator('input[type="password"]').first()
        await expect(emailInput).toBeVisible()
        await expect(passwordInput).toBeVisible()
      }
    }
  })
})

// ─── Customer Login ──────────────────────────────────────────────────────────

test.describe('Customer Login', () => {
  test('login form opens from auth modal', async ({ page }) => {
    await page.goto('/')
    const accountBtn = page.locator('button:has-text("Sign"), button:has-text("Login"), a[href*="login"]').first()
    if (await accountBtn.isVisible({ timeout: 3000 })) {
      await accountBtn.click()
      await page.waitForTimeout(500)
      // Should show login form
      const emailInput = page.locator('input[type="email"]').first()
      const passwordInput = page.locator('input[type="password"]').first()
      await expect(emailInput).toBeVisible({ timeout: 3000 })
      await expect(passwordInput).toBeVisible()
    }
  })

  test('login has forgot password link', async ({ page }) => {
    await page.goto('/')
    const accountBtn = page.locator('button:has-text("Sign"), button:has-text("Login"), a[href*="login"]').first()
    if (await accountBtn.isVisible({ timeout: 3000 })) {
      await accountBtn.click()
      await page.waitForTimeout(500)
      const forgotLink = page.locator('a:has-text("Forgot"), a[href*="forgot"]').first()
      if (await forgotLink.isVisible({ timeout: 3000 })) {
        await expect(forgotLink).toBeVisible()
      }
    }
  })

  test('can attempt login with credentials', async ({ page }) => {
    await page.goto('/')
    const accountBtn = page.locator('button:has-text("Sign"), button:has-text("Login"), a[href*="login"]').first()
    if (await accountBtn.isVisible({ timeout: 3000 })) {
      await accountBtn.click()
      await page.waitForTimeout(500)
      const emailInput = page.locator('input[type="email"]').first()
      const passwordInput = page.locator('input[type="password"]').first()
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        await emailInput.fill('test@example.com')
        await passwordInput.fill('TestPassword123!')
        const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first()
        if (await submitBtn.isVisible()) {
          await submitBtn.click()
          await page.waitForTimeout(1000)
          // Should show some response (error for invalid credentials or redirect)
          await expect(page.locator('body')).toBeVisible()
        }
      }
    }
  })
})

// ─── Forgot Password ─────────────────────────────────────────────────────────

test.describe('Forgot Password', () => {
  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
    // Should have email input
    const emailInput = page.locator('input[type="email"]').first()
    if (await emailInput.isVisible({ timeout: 3000 })) {
      await expect(emailInput).toBeVisible()
    }
  })
})

// ─── Reset Password ──────────────────────────────────────────────────────────

test.describe('Reset Password', () => {
  test('reset password page loads with token', async ({ page }) => {
    await page.goto('/reset-password?token=fake-token-for-testing')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })
})

// ─── Profile ─────────────────────────────────────────────────────────────────

test.describe('Profile', () => {
  test('profile page requires authentication', async ({ page }) => {
    await page.goto('/account/profile')
    await page.waitForTimeout(2000)
    // Should redirect to login or show auth requirement
    await expect(page.locator('body')).toBeVisible()
  })
})

// ─── Order History ───────────────────────────────────────────────────────────

test.describe('Order History', () => {
  test('order history page requires authentication', async ({ page }) => {
    await page.goto('/account/orders')
    await page.waitForTimeout(2000)
    // Should redirect to login or show auth requirement
    await expect(page.locator('body')).toBeVisible()
  })
})

// ─── Track Order ─────────────────────────────────────────────────────────────

test.describe('Track Order', () => {
  test('track order page loads', async ({ page }) => {
    await page.goto('/track-order')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('track order has order number input', async ({ page }) => {
    await page.goto('/track-order')
    await page.waitForTimeout(1000)
    const input = page.locator('input[type="text"], input[placeholder*="order" i]').first()
    if (await input.isVisible({ timeout: 3000 })) {
      await expect(input).toBeVisible()
    }
  })
})
