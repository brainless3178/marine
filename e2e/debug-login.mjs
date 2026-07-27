/**
 * Debug the admin login flow step by step.
 * Run: node e2e/debug-login.mjs
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [CONSOLE ERROR] ${msg.text()}`)
  })

  try {
    // Clear any existing auth state
    await page.goto(BASE + '/admin/login')
    await page.evaluate(() => {
      localStorage.clear()
    })
    await page.reload()
    console.log('1. Navigated to /admin/login — page cleared')

    // Wait for the form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    console.log('2. Email input found')

    // Set cookie consent
    await page.evaluate(() => {
      localStorage.setItem('alka-cookie-consent', JSON.stringify({ accepted: true, timestamp: Date.now() }))
    })

    // Fill credentials
    await page.locator('input[type="email"]').fill('admin@alkatraders.com')
    await page.locator('input[type="password"]').fill('admin123')
    console.log('3. Form filled')

    // Click submit
    await page.locator('button[type="submit"]').click()
    console.log('4. Submit clicked — waiting for navigation...')

    // Check what happens over time
    for (let i = 1; i <= 10; i++) {
      await page.waitForTimeout(2000)
      const url = page.url()
      const hasH1 = await page.locator('h1').count()
      const h1Texts = await page.locator('h1').allTextContents()
      const hasDash = h1Texts.some(t => t.includes('Dashboard'))
      const isLogin = url.includes('/login')
      console.log(`   ${i * 2}s — URL: ${url.replace(BASE, '')} | h1s: ${h1Texts.join(', ')} | Dashboard: ${hasDash} | On login: ${isLogin}`)

      if (hasDash) {
        console.log('\n✅ Dashboard found! Login works.')
        break
      }
    }

    // Final state
    const finalUrl = page.url()
    const finalH1 = await page.locator('h1').allTextContents()
    console.log(`\nFinal URL: ${finalUrl}`)
    console.log(`Final h1s: ${finalH1.join(', ')}`)

    // Check for error messages
    const errorEl = page.locator('[class*="error"], [class*="alert"], [class*="danger"]').first()
    const errorText = await errorEl.isVisible().then(() => errorEl.textContent()).catch(() => 'none')
    console.log(`Error text visible: ${errorText}`)

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`)
  } finally {
    await browser.close()
  }
}

run()
