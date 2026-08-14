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
 * build step was skipped or failed), we kick the build off in the background
 * and start listening immediately, serving a warm-up page until index.html
 * exists. Blocking the process here made Hostinger's proxy time out and every
 * request came back 408. If the background build fails too, the warm-up page
 * stays up with a hint instead of crashing (no restart loop).
 */
import express from 'express'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3000
const distPath = path.join(__dirname, 'frontend', 'dist')
const indexPath = path.join(distPath, 'index.html')

// ─── Non-blocking self-healing build ─────────────────────────────
let serving = false

function registerStaticHandlers() {
  if (serving) return
  serving = true
  // Serve the built SPA
  app.use(express.static(distPath))

  // SPA fallback — any non-asset route returns index.html so client-side
  // routing (e.g. /products, /admin) works on refresh / deep links.
  app.get('*', (_req, res) => {
    res.sendFile(indexPath)
  })
}

if (fs.existsSync(indexPath)) {
  registerStaticHandlers()
} else {
  console.error(`X Build not found at ${distPath}`)
  console.error('  Starting on-the-fly build in the background...')
  const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js')
  const runBuild = () => {
    // shell:true — npm/node wrappers are .cmd files on Windows, scripts on Linux.
    const child = spawn('node', ['./node_modules/vite/bin/vite.js', 'build'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('error', (err) => {
      console.error(`X Could not start on-the-fly build: ${err.message}`)
    })
    child.on('exit', (code) => {
      if (code === 0 && fs.existsSync(indexPath)) {
        console.log(`V Build finished — now serving ${distPath}`)
        registerStaticHandlers()
      } else {
        console.error(`X On-the-fly build failed (exit code ${code}) — keeping the warm-up page up`)
      }
    })
  }
  if (!fs.existsSync(viteBin)) {
    console.error('  vite not installed — installing root dependencies first...')
    const install = spawn('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    install.on('error', (err) => {
      console.error(`X Could not start npm install: ${err.message}`)
    })
    install.on('exit', (code) => {
      if (code === 0) {
        runBuild()
      } else {
        console.error(`X npm install failed (exit code ${code}) — keeping the warm-up page up`)
      }
    })
  } else {
    runBuild()
  }
}

// While the build is running, answer instantly instead of hanging so the
// proxy never times out: fast 204 for /favicon.ico, warm-up page elsewhere.
app.use((req, res, next) => {
  if (serving) return next()
  if (req.url === '/favicon.ico') return res.status(204).end()
  res.status(503).type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="10"><title>Starting...</title></head>
<body style="font-family:system-ui;max-width:640px;margin:80px auto;padding:0 20px">
<h1>Alka Traders is starting up</h1>
<p>The production build is being generated right now. This page refreshes automatically and the site will appear when it is ready.</p>
<p>If this page persists, check the Hostinger deployment log for build errors, then redeploy.</p>
</body></html>`)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend serving ${distPath} on port ${PORT}`)
})