/**
 * copy-frontend.mjs
 * 
 * Copies the Vite frontend build output (frontend/dist) into the project
 * root's frontend-dist/ directory as a legacy convenience artifact.
 * 
 * Used by: npm run build (full local build chain)
 */
import { cpSync, mkdirSync, existsSync, rmSync } from 'fs'
import { resolve } from 'path'

// Vite outputs to frontend/dist (see vite.config.ts), not root dist/.
const src = resolve('frontend/dist')
const dest = resolve('frontend-dist')

if (!existsSync(src)) {
  console.error('❌ Frontend build output not found at dist/')
  console.error('   Run "npm run build" first to build the frontend.')
  process.exit(1)
}

// Clean previous copy
if (existsSync(dest)) {
  rmSync(dest, { recursive: true })
}

mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })
console.log('✅ Frontend build copied to frontend-dist/')
