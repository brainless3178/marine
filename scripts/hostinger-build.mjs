#!/usr/bin/env node
/**
 * hostinger-build.mjs
 * 
 * Unified build script for Hostinger deployment.
 * Runs from the project root and:
 * 1. Builds the React frontend (Vite)
 * 2. Compiles the Express backend (TypeScript → JS)
 * 3. Generates Prisma client
 * 4. Copies frontend dist → frontend-dist for backend to serve
 */

import { execSync } from 'child_process'
import { cpSync, mkdirSync, existsSync, rmSync } from 'fs'
import { resolve } from 'path'

const run = (cmd, cwd = '.') => {
  console.log(`\n▶ ${cmd} (in ${cwd})`)
  execSync(cmd, { stdio: 'inherit', cwd: resolve(cwd) })
}

// 1. Install root dependencies (already done by Hostinger, but ensure prisma is ready)
console.log('\n📦 Step 1: Install backend dependencies...')
run('npm install --ignore-scripts', 'backend')

// 2. Generate Prisma client
console.log('\n🔧 Step 2: Generate Prisma client...')
run('npx prisma generate', 'backend')

// 3. Build the TypeScript backend
console.log('\n🔨 Step 3: Compile backend TypeScript...')
run('npx tsc', 'backend')

// 4. Build the React frontend
console.log('\n⚛️  Step 4: Build React frontend...')
run('node ./node_modules/vite/bin/vite.js build')

// 5. Run prerender
console.log('\n🖨️  Step 5: Prerender pages...')
try {
  run('node scripts/prerender.mjs')
} catch (e) {
  console.warn('⚠️  Prerender failed (non-fatal):', e.message)
}

// 6. Generate sitemap
console.log('\n🗺️  Step 6: Generate sitemap...')
try {
  run('node scripts/generate-sitemap.mjs')
} catch (e) {
  console.warn('⚠️  Sitemap generation failed (non-fatal):', e.message)
}

// 7. Copy frontend build → frontend-dist
console.log('\n📋 Step 7: Copy frontend build to frontend-dist...')
const src = resolve('dist')
const dest = resolve('frontend-dist')
if (existsSync(dest)) rmSync(dest, { recursive: true })
mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })

console.log('\n✅ Hostinger build complete!')
console.log('   Frontend: frontend-dist/')
console.log('   Backend:  backend/dist/server.js')
