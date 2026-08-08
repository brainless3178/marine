/**
 * Root Server Entry Point — Frontend App (alkatraders.co)
 *
 * Hostinger Node.js Web App config for THIS app:
 *   Application root: (blank — repository root)
 *   Build command:    npm install && node ./node_modules/vite/bin/vite.js build
 *   Start command:    node server.js
 *   Entry file:       server.js
 *   Node.js:          22.x
 *
 * Vite outputs the production build to frontend/dist/ (see vite.config.ts),
 * and this server serves exactly that directory with an SPA fallback.
 * The API lives in a separate Hostinger app (api.alkatraders.co) and is
 * called directly from the browser via VITE_API_URL — no proxying here.
 *
 * Self-healing: if the build output is missing at startup (e.g. the deploy
 * build step was skipped or failed), we run the Vite build on the fly and,
 * only if that fails too, serve a clear diagnostic page instead of crashing
 * (which would make Hostinger restart the app in a loop).
 */
import express from 'express'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3000
const distPath = path.join(__dirname, 'frontend', 'dist')
const indexPath = path.join(distPath, 'index.html')

// ─── Ensure the production build exists ──────────────────────────
if (!fs.existsSync(indexPath)) {
  console.error(`✖ Build not found at ${distPath}`)
  console.error('  Attempting on-the-fly build...')
  try {
    execSync('node ./node_modules/vite/bin/vite.js build', {
      cwd: __dirname,
      stdio: 'inherit',
      timeout: 5 * 60 * 1000,
    })
  } catch (err) {
    console.error('  On-the-fly build failed:', err.message)
  }
}

if (!fs.existsSync(indexPath)) {
  // Serve a diagnostic page instead of crash-looping, so the site is never
  // a confusing 404/500 and the cause is visible in the browser.
  console.error(`✖ Build still missing at ${distPath}`)
  app.get('*', (_req, res) => {
    res.status(503).type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Build missing</title></head>
<body style="font-family:system-ui;max-width:640px;margin:80px auto;padding:0 20px">
<h1>Frontend build not found</h1>
<p>The production build is missing at <code>${distPath}</code>.</p>
<p>The deploy build command should create it:
<code>npm install && node ./node_modules/vite/bin/vite.js build</code></p>
<p>Check the Hostinger deployment log for build errors, then redeploy.</p>
</body></html>`)
  })
} else {
  // Serve the built SPA
  app.use(express.static(distPath))

  // SPA fallback — any non-asset route returns index.html so client-side
  // routing (e.g. /products, /admin) works on refresh / deep links.
  app.get('*', (_req, res) => {
    res.sendFile(indexPath)
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend serving ${distPath} on port ${PORT}`)
})
