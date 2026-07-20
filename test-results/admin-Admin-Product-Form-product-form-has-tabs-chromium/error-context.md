# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Product Form >> product form has tabs
- Location: e2e\admin.spec.ts:178:3

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 1
Received:    0
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - heading "Alka Traders" [level=1] [ref=e10]
      - paragraph [ref=e11]: Admin Panel Access
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Email Address
        - generic [ref=e16]:
          - img [ref=e17]
          - textbox "admin@alkatraders.com" [ref=e20]
      - generic [ref=e21]:
        - generic [ref=e22]: Password
        - generic [ref=e23]:
          - img [ref=e24]
          - textbox "Enter your password" [ref=e27]
          - button [ref=e28] [cursor=pointer]:
            - img [ref=e29]
      - button "Sign In" [ref=e32] [cursor=pointer]:
        - text: Sign In
        - img [ref=e33]
    - paragraph [ref=e35]:
      - link "← Back to Storefront" [ref=e36] [cursor=pointer]:
        - /url: /
  - generic [ref=e39]:
    - generic [ref=e40]:
      - img [ref=e41]
      - generic [ref=e43]:
        - heading "Cookie Notice" [level=3] [ref=e44]
        - paragraph [ref=e45]:
          - text: We use essential cookies for authentication and session management. These cookies are strictly necessary for the website to function. We do not use third-party tracking cookies. By continuing to use this site, you consent to the use of essential cookies. Read our
          - link "Privacy Policy" [ref=e46] [cursor=pointer]:
            - /url: /privacy-policy
          - text: for more details.
    - generic [ref=e47]:
      - button "Decline" [ref=e48] [cursor=pointer]
      - button "Accept" [ref=e49] [cursor=pointer]
```

# Test source

```ts
  98  |         }
  99  |       }
  100 |     }
  101 |   })
  102 | })
  103 | 
  104 | // ─── Admin Products ──────────────────────────────────────────────────────────
  105 | 
  106 | test.describe('Admin Products', () => {
  107 |   test('products page loads with product list', async ({ page }) => {
  108 |     await page.goto('/admin/login')
  109 |     await page.waitForTimeout(2000)
  110 |     // Try to login
  111 |     const emailInput = page.locator('input[type="email"], input[type="text"]').first()
  112 |     const passwordInput = page.locator('input[type="password"]').first()
  113 |     if (await emailInput.isVisible() && await passwordInput.isVisible()) {
  114 |       await emailInput.fill('admin@alkatraders.com')
  115 |       await passwordInput.fill('admin123')
  116 |       const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
  117 |       if (await submitBtn.isVisible()) {
  118 |         await submitBtn.click()
  119 |         await page.waitForTimeout(3000)
  120 |         // Navigate to products
  121 |         await page.goto('/admin/products')
  122 |         await page.waitForTimeout(2000)
  123 |         await expect(page.locator('body')).toBeVisible()
  124 |       }
  125 |     }
  126 |   })
  127 | 
  128 |   test('add product button exists', async ({ page }) => {
  129 |     await page.goto('/admin/login')
  130 |     await page.waitForTimeout(2000)
  131 |     const emailInput = page.locator('input[type="email"], input[type="text"]').first()
  132 |     const passwordInput = page.locator('input[type="password"]').first()
  133 |     if (await emailInput.isVisible() && await passwordInput.isVisible()) {
  134 |       await emailInput.fill('admin@alkatraders.com')
  135 |       await passwordInput.fill('admin123')
  136 |       const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
  137 |       if (await submitBtn.isVisible()) {
  138 |         await submitBtn.click()
  139 |         await page.waitForTimeout(3000)
  140 |         await page.goto('/admin/products')
  141 |         await page.waitForTimeout(2000)
  142 |         const addBtn = page.locator('a:has-text("Add Product"), button:has-text("Add Product")').first()
  143 |         if (await addBtn.isVisible({ timeout: 3000 })) {
  144 |           await expect(addBtn).toBeVisible()
  145 |         }
  146 |       }
  147 |     }
  148 |   })
  149 | })
  150 | 
  151 | // ─── Admin Product Form ──────────────────────────────────────────────────────
  152 | 
  153 | test.describe('Admin Product Form', () => {
  154 |   test('new product form loads', async ({ page }) => {
  155 |     await page.goto('/admin/login')
  156 |     await page.waitForTimeout(2000)
  157 |     const emailInput = page.locator('input[type="email"], input[type="text"]').first()
  158 |     const passwordInput = page.locator('input[type="password"]').first()
  159 |     if (await emailInput.isVisible() && await passwordInput.isVisible()) {
  160 |       await emailInput.fill('admin@alkatraders.com')
  161 |       await passwordInput.fill('admin123')
  162 |       const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
  163 |       if (await submitBtn.isVisible()) {
  164 |         await submitBtn.click()
  165 |         await page.waitForTimeout(3000)
  166 |         await page.goto('/admin/products/new')
  167 |         await page.waitForTimeout(2000)
  168 |         await expect(page.locator('body')).toBeVisible()
  169 |         // Should have form fields
  170 |         const nameInput = page.locator('input[placeholder*="product" i], input[name*="name" i]').first()
  171 |         if (await nameInput.isVisible({ timeout: 3000 })) {
  172 |           await expect(nameInput).toBeVisible()
  173 |         }
  174 |       }
  175 |     }
  176 |   })
  177 | 
  178 |   test('product form has tabs', async ({ page }) => {
  179 |     await page.goto('/admin/login')
  180 |     await page.waitForTimeout(2000)
  181 |     const emailInput = page.locator('input[type="email"], input[type="text"]').first()
  182 |     const passwordInput = page.locator('input[type="password"]').first()
  183 |     if (await emailInput.isVisible() && await passwordInput.isVisible()) {
  184 |       await emailInput.fill('admin@alkatraders.com')
  185 |       await passwordInput.fill('admin123')
  186 |       const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
  187 |       if (await submitBtn.isVisible()) {
  188 |         await submitBtn.click()
  189 |         await page.waitForTimeout(3000)
  190 |         // Navigate to new product form
  191 |         await page.goto('/admin/products/new', { waitUntil: 'domcontentloaded', timeout: 60000 })
  192 |         await page.waitForTimeout(5000)
  193 |         // The form has tab buttons inside a nav element — verify the page loaded
  194 |         await expect(page.locator('body')).toBeVisible()
  195 |         // Check for product form content — the Basics tab or product name field
  196 |         const formContent = page.locator('button:has-text("Basics"), button:has-text("Inventory"), input[placeholder*="product" i], input[placeholder*="Hydraulic" i]')
  197 |         const count = await formContent.count()
> 198 |         expect(count).toBeGreaterThanOrEqual(1)
      |                       ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  199 |       }
  200 |     }
  201 |   })
  202 | })
  203 | 
  204 | // ─── Admin Orders ────────────────────────────────────────────────────────────
  205 | 
  206 | test.describe('Admin Orders', () => {
  207 |   test('orders page loads', async ({ page }) => {
  208 |     await page.goto('/admin/login')
  209 |     await page.waitForTimeout(2000)
  210 |     const emailInput = page.locator('input[type="email"], input[type="text"]').first()
  211 |     const passwordInput = page.locator('input[type="password"]').first()
  212 |     if (await emailInput.isVisible() && await passwordInput.isVisible()) {
  213 |       await emailInput.fill('admin@alkatraders.com')
  214 |       await passwordInput.fill('admin123')
  215 |       const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
  216 |       if (await submitBtn.isVisible()) {
  217 |         await submitBtn.click()
  218 |         await page.waitForTimeout(3000)
  219 |         await page.goto('/admin/orders')
  220 |         await page.waitForTimeout(2000)
  221 |         await expect(page.locator('body')).toBeVisible()
  222 |       }
  223 |     }
  224 |   })
  225 | })
  226 | 
  227 | // ─── Admin Categories ────────────────────────────────────────────────────────
  228 | 
  229 | test.describe('Admin Categories', () => {
  230 |   test('categories page loads', async ({ page }) => {
  231 |     await page.goto('/admin/login')
  232 |     await page.waitForTimeout(2000)
  233 |     const emailInput = page.locator('input[type="email"], input[type="text"]').first()
  234 |     const passwordInput = page.locator('input[type="password"]').first()
  235 |     if (await emailInput.isVisible() && await passwordInput.isVisible()) {
  236 |       await emailInput.fill('admin@alkatraders.com')
  237 |       await passwordInput.fill('admin123')
  238 |       const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
  239 |       if (await submitBtn.isVisible()) {
  240 |         await submitBtn.click()
  241 |         await page.waitForTimeout(3000)
  242 |         await page.goto('/admin/categories')
  243 |         await page.waitForTimeout(2000)
  244 |         await expect(page.locator('body')).toBeVisible()
  245 |       }
  246 |     }
  247 |   })
  248 | })
  249 | 
  250 | // ─── Admin Brands ────────────────────────────────────────────────────────────
  251 | 
  252 | test.describe('Admin Brands', () => {
  253 |   test('brands page loads', async ({ page }) => {
  254 |     await page.goto('/admin/login')
  255 |     await page.waitForTimeout(2000)
  256 |     const emailInput = page.locator('input[type="email"], input[type="text"]').first()
  257 |     const passwordInput = page.locator('input[type="password"]').first()
  258 |     if (await emailInput.isVisible() && await passwordInput.isVisible()) {
  259 |       await emailInput.fill('admin@alkatraders.com')
  260 |       await passwordInput.fill('admin123')
  261 |       const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
  262 |       if (await submitBtn.isVisible()) {
  263 |         await submitBtn.click()
  264 |         await page.waitForTimeout(3000)
  265 |         await page.goto('/admin/brands')
  266 |         await page.waitForTimeout(2000)
  267 |         await expect(page.locator('body')).toBeVisible()
  268 |       }
  269 |     }
  270 |   })
  271 | })
  272 | 
  273 | // ─── Admin Industries ────────────────────────────────────────────────────────
  274 | 
  275 | test.describe('Admin Industries', () => {
  276 |   test('industries page loads', async ({ page }) => {
  277 |     await page.goto('/admin/login')
  278 |     await page.waitForTimeout(2000)
  279 |     const emailInput = page.locator('input[type="email"], input[type="text"]').first()
  280 |     const passwordInput = page.locator('input[type="password"]').first()
  281 |     if (await emailInput.isVisible() && await passwordInput.isVisible()) {
  282 |       await emailInput.fill('admin@alkatraders.com')
  283 |       await passwordInput.fill('admin123')
  284 |       const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first()
  285 |       if (await submitBtn.isVisible()) {
  286 |         await submitBtn.click()
  287 |         await page.waitForTimeout(3000)
  288 |         await page.goto('/admin/industries')
  289 |         await page.waitForTimeout(2000)
  290 |         await expect(page.locator('body')).toBeVisible()
  291 |       }
  292 |     }
  293 |   })
  294 | })
  295 | 
  296 | // ─── Admin Customers ─────────────────────────────────────────────────────────
  297 | 
  298 | test.describe('Admin Customers', () => {
```