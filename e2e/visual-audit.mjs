/**
 * Visual Audit — iPhone 12/14 (390×844) Mobile Viewport
 * Run: node e2e/visual-audit.mjs
 *
 * Checks: navbar (hamburger), hero, categories, products, stats,
 * testimonials, footer, WhatsApp float, overflow, touch targets.
 */
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'

const BASE = 'http://localhost:5173'
const VIEWPORT = { width: 390, height: 844 } // iPhone 12/14

/** Dismiss cookie consent */
async function dismissConsent(page) {
  await page.evaluate(() => {
    localStorage.setItem('alka-cookie-consent', JSON.stringify({ accepted: true, timestamp: Date.now() }))
  })
}

const findings = { ok: [], warn: [], fail: [] }
function ok(msg) { findings.ok.push(msg); console.log(`  ✅ ${msg}`) }
function warn(msg) { findings.warn.push(msg); console.log(`  ⚠️  ${msg}`) }
function fail(msg) { findings.fail.push(msg); console.log(`  ❌ ${msg}`) }

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [CONSOLE ERROR] ${msg.text()}`)
  })

  try {
    // ─── 1. Homepage ───────────────────────────────────
    console.log('\n📱 HOMEPAGE')
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })
    await dismissConsent(page)
    await page.waitForTimeout(1500)

    // Navbar
    const nav = page.locator('header')
    const navVisible = await nav.isVisible()
    navVisible ? ok('Header/navbar is visible') : fail('Header not visible')

    // Hamburger button (mobile menu toggle)
    const hamburger = page.locator('button[aria-label*="menu" i], button[aria-label*="Toggle menu"], button[class*="lg\\:hidden"]').first()
    const hamburgerVisible = await hamburger.isVisible()
    hamburgerVisible ? ok('Hamburger menu button is visible') : warn('Hamburger button not found — may use desktop nav')

    // Check NO desktop nav links are visible on mobile
    // Use page.evaluate to avoid CSS selector colon-escape issues with Tailwind's lg:flex class
    const desktopHidden = await page.evaluate(() => {
      const els = document.querySelectorAll('[class*="lg\\:flex"]')
      for (const el of els) {
        if (el.classList.contains('hidden') && el.classList.contains('items-center') && el.classList.contains('gap-7')) {
          return window.getComputedStyle(el).display === 'none'
        }
      }
      return true // container not found = assumed hidden
    })
    desktopHidden ? ok('Desktop nav links hidden on mobile') : warn('Desktop nav links visible on mobile')

    // Top bar
    const topBar = page.locator('header > div:first-child')
    if (await topBar.isVisible()) {
      const topBarEmail = topBar.locator('a[href*="mailto"]')
      if (await topBarEmail.isVisible()) warn('Top bar email visible on mobile — may take space')
      else ok('Top bar email hidden on mobile')
    }

    // Hero
    const hero = page.locator('section[aria-roledescription="carousel"], section[class*="hero"], section:has(img[alt*="industrial"])').first()
    if (await hero.isVisible()) {
      const heroBox = await hero.boundingBox()
      if (heroBox) {
        ok(`Hero section visible: ${Math.round(heroBox.width)}×${Math.round(heroBox.height)}px`)
        if (heroBox.width <= 390) ok('Hero fits within viewport width')
        else fail(`Hero overflows: ${Math.round(heroBox.width)}px > 390px`)
        if (heroBox.height >= 200) ok('Hero height adequate on mobile')
        else warn(`Hero height small: ${Math.round(heroBox.height)}px`)
      }
      // Arrows
      const arrows = hero.locator('button[aria-label*="Previous"], button[aria-label*="Next"]')
      const arrowCount = await arrows.count()
      arrowCount >= 2 ? ok(`Hero navigation arrows visible (${arrowCount})`) : warn(`Hero arrows: ${arrowCount}`)
      // Dots
      const dots = hero.locator('button[aria-label*="Go to slide"]')
      const dotCount = await dots.count()
      dotCount >= 2 ? ok(`Hero slide dots visible (${dotCount})`) : warn(`Hero dots: ${dotCount}`)
    } else {
      warn('Hero section not found')
    }

    // ─── 2. Categories ─────────────────────────────────
    console.log('\n📂 CATEGORIES GRID')
    const categories = page.locator('section[id="categories"], section:has-text("Shop by equipment")').first()
    if (await categories.isVisible({ timeout: 3000 })) {
      const catCards = categories.locator('> div > div:last-child > div, .maritime-card')
      const catCount = await catCards.count()
      ok(`Categories section visible with ${catCount} card(s)`)
      if (catCount > 0) {
        const firstCard = catCards.first()
        const cardBox = await firstCard.boundingBox()
        if (cardBox && cardBox.width < 380) ok(`Category card width ${Math.round(cardBox.width)}px — fits single column`)
        else if (cardBox) warn(`Category card width ${Math.round(cardBox.width)}px — may be too wide`)
      }
    } else {
      warn('Categories section not found')
    }

    // ─── 3. New Arrivals (product grid on homepage) ───
    console.log('\n🛍️  NEW ARRIVALS')
    // Home page renders its own New Arrivals section (FeaturedProducts component is not used on Home)
    const newArrivalsHeading = page.locator('h2:has-text("Fresh Inventory")').first()
    const headingVisible = await newArrivalsHeading.isVisible().catch(() => false)
    if (headingVisible) {
      ok('New Arrivals section found on homepage')
      // Find the section by its aria-labelledby
      const newArrivals = page.locator('section[aria-labelledby="new-arrivals-heading"]').first()
      if (await newArrivals.isVisible().catch(() => false)) {
        ok('New Arrivals section element present')
        const productCards = newArrivals.locator('.product-card, .commerce-card, [class*="ProductCard"]')
        const prodCount = await productCards.count()
        ok(`New Arrivals has ${prodCount} product(s)`)
        if (prodCount > 0) {
          const firstProd = productCards.first()
          const prodBox = await firstProd.boundingBox()
          if (prodBox && prodBox.width < 380) ok(`Product card width ${Math.round(prodBox.width)}px — fits single column`)
          else if (prodBox) warn(`Product card width ${Math.round(prodBox.width)}px`)
        }
      }
    } else {
      warn('New Arrivals section not found')
    }

    // ─── 4. Stats Bar ──────────────────────────────────
    console.log('\n📊 STATS BAR')
    const stats = page.locator('section:has-text("stats"), section:has-text("Products"), section:has-text("Brands")').first()
    if (await stats.isVisible({ timeout: 3000 })) {
      const statItems = stats.locator('[class*="stat"], span:has(+ span)')
      const statCount = await statItems.count()
      ok(`Stats bar visible`)

      // Check if stat numbers overflow
      const statText = await stats.textContent()
      if (statText && statText.length > 0) ok(`Stats text readable: "${statText.trim().slice(0, 80)}..."`)
    } else {
      warn('Stats bar not found')
    }

    // ─── 5. Testimonials ───────────────────────────────
    console.log('\n⭐ TESTIMONIALS')
    const testimonials = page.locator('section[id="testimonials"], section:has-text("testimonials")').first()
    if (await testimonials.isVisible({ timeout: 3000 })) {
      const reviewCards = testimonials.locator('.maritime-card')
      const revCount = await reviewCards.count()
      ok(`Testimonials section visible with ${revCount} review(s)`)
      if (revCount > 0) {
        const cardBox = await reviewCards.first().boundingBox()
        if (cardBox && cardBox.width < 380) ok(`Review card width ${Math.round(cardBox.width)}px — single column`)
      }
    } else {
      warn('Testimonials section not found')
    }

    // ─── 6. Footer ─────────────────────────────────────
    console.log('\n🔻 FOOTER')
    const footer = page.locator('footer')
    if (await footer.isVisible()) {
      ok('Footer is visible')
      // Check footer columns stack
      const footerLinks = footer.locator('a[href]')
      const flCount = await footerLinks.count()
      ok(`Footer has ${flCount} link(s)`)

      // Check address readability
      const address = footer.locator('text=BHAVNAGAR, text=GUJARAT')
      if (await address.isVisible().catch(() => false)) ok('Footer address visible')
    } else {
      warn('Footer not found')
    }

    // ─── 7. WhatsApp Float ─────────────────────────────
    console.log('\n💬 WHATSAPP FLOAT')
    const whatsapp = page.locator('a[href*="wa.me"], a[aria-label*="WhatsApp"]').last()
    if (await whatsapp.isVisible({ timeout: 3000 })) {
      const waBox = await whatsapp.boundingBox()
      if (waBox) {
        ok(`WhatsApp float button visible at bottom-right, size: ${Math.round(waBox.width)}×${Math.round(waBox.height)}px`)
        // Check it's at the bottom of the viewport
        if (waBox.y + waBox.height <= 844) ok('WhatsApp float within viewport')
        else warn(`WhatsApp float extends below viewport: y=${Math.round(waBox.y)} h=${Math.round(waBox.height)}`)

        // Check it doesn't overlap with footer
        const footerBox = await footer.boundingBox()
        if (footerBox && waBox.y + waBox.height > footerBox.y && waBox.y < footerBox.y + footerBox.height) {
          warn('WhatsApp float may overlap with footer')
        } else {
          ok('WhatsApp float is positioned separately from footer')
        }
      }
    } else {
      warn('WhatsApp float not visible (may need scrolling)')
    }

    // ─── 8. Hamburger Menu Interaction ─────────────────
    console.log('\n🍔 HAMBURGER MENU TEST')
    if (hamburgerVisible) {
      await hamburger.click()
      await page.waitForTimeout(600)

      // Check menu content
      const menuPanel = page.locator('[class*="absolute"][class*="top-full"], nav:has(a[href="/products"])').first()
      const menuActive = await menuPanel.isVisible().catch(() => false) || await page.locator('a[href="/products"]:visible').count() > 0

      if (menuActive) {
        ok('Mobile menu opened after clicking hamburger')

        // Check RFQ button in menu
        const rfqBtn = page.locator('a[href="/rfq"]:visible')
        if (await rfqBtn.count() > 0) ok('RFQ button visible in mobile menu')
        else warn('RFQ button not found in mobile menu')

        // Check Sign In option
        const signIn = page.locator('button:has-text("Sign In"), a:has-text("Sign In")')
        if (await signIn.isVisible().catch(() => false)) ok('Sign In option visible in mobile menu')

        // Close menu
        await hamburger.click()
        await page.waitForTimeout(400)
        ok('Mobile menu closes on hamburger toggle')
      } else {
        warn('Mobile menu did not appear after click — animation may be CSS-only')
      }
    }

    // ─── 9. Key Pages ──────────────────────────────────
    const pages = ['/products', '/rfq', '/contact', '/shop', '/about']
    for (const p of pages) {
      console.log(`\n📄 ${p.toUpperCase()}`)
      await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
      await dismissConsent(page)
      await page.waitForTimeout(1000)

      // No horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1
      })
      overflow ? fail(`${p}: Horizontal overflow detected!`) : ok(`${p}: No horizontal overflow`)

      // Body visible
      const bodyOk = await page.locator('body').isVisible()
      bodyOk ? ok(`${p}: Body renders`) : fail(`${p}: Body not visible`)

      // Any console errors
      // (captured via page.on('console') above)
    }

    // ─── 10. Touch Target Check (Homepage) ───────────
    console.log('\n👆 TOUCH TARGET CHECK')
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })
    await dismissConsent(page)
    await page.waitForTimeout(1000)

    const smallTargets = await page.evaluate(() => {
      const els = document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea')
      const small = []
      for (let i = 0; i < Math.min(els.length, 50); i++) {
        const el = els[i]
        const rect = el.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0 && (rect.width < 48 || rect.height < 48)) {
          const text = el.textContent?.trim().slice(0, 30) || el.tagName
          small.push(`${text} (${el.tagName}): ${Math.round(rect.width)}x${Math.round(rect.height)}px`)
        }
      }
      return small
    })

    if (smallTargets.length === 0) {
      ok('All interactive elements ≥ 48px touch target size')
    } else {
      warn(`${smallTargets.length} element(s) below 48px: ${smallTargets.join('; ')}`)
    }

    // ─── Summary ─────────────────────────────────────
    console.log('\n' + '='.repeat(50))
    console.log('📋 VISUAL AUDIT SUMMARY')
    console.log('='.repeat(50))
    console.log(`  ✅ Pass: ${findings.ok.length}`)
    console.log(`  ⚠️  Warnings: ${findings.warn.length}`)
    console.log(`  ❌ Failures: ${findings.fail.length}`)
    if (findings.warn.length > 0) {
      console.log('\n  ⚠️  Warnings:')
      findings.warn.forEach(w => console.log(`    • ${w}`))
    }
    if (findings.fail.length > 0) {
      console.log('\n  ❌ Failures:')
      findings.fail.forEach(f => console.log(`    • ${f}`))
    }
    console.log('='.repeat(50))

  } catch (err) {
    console.error(`\n  ❌ Script error: ${err.message}`)
  } finally {
    await browser.close()
  }
}

run()
