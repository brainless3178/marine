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
 */
import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3000
const distPath = path.join(__dirname, 'frontend', 'dist')
const indexPath = path.join(distPath, 'index.html')

// Fail fast with a clear message if the build output is missing —
// otherwise the SPA fallback would surface a confusing generic 500.
if (!fs.existsSync(indexPath)) {
  console.error(`✖ Build not found at ${distPath}`)
  console.error('  Run the build first: node ./node_modules/vite/bin/vite.js build')
  process.exit(1)
}

// Serve the built SPA
app.use(express.static(distPath))

// SPA fallback — any non-asset route returns index.html so client-side
// routing (e.g. /products, /admin) works on refresh / deep links.
app.get('*', (_req, res) => {
  res.sendFile(indexPath)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend serving ${distPath} on port ${PORT}`)
})
