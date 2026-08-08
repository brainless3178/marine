#!/usr/bin/env node
/**
 * hostinger-zip.mjs
 * 
 * Creates a deployment package for Hostinger Node.js hosting.
 * Compiles frontend + backend and creates a ready-to-upload folder.
 * 
 * Usage: node scripts/hostinger-zip.mjs
 * Output: hostinger-deploy/ folder (zip it manually or run the zip command)
 */

import { execSync } from 'child_process'
import { cpSync, mkdirSync, existsSync, rmSync, writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve('.')
const DEPLOY_DIR = resolve('hostinger-deploy')

const run = (cmd, cwd = '.') => {
  console.log(`\n▶ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: resolve(cwd) })
}

console.log('🚀 Creating Hostinger deployment package...\n')

// Clean previous deploy directory
if (existsSync(DEPLOY_DIR)) rmSync(DEPLOY_DIR, { recursive: true })
mkdirSync(DEPLOY_DIR, { recursive: true })

// Step 1: Build backend
console.log('\n📦 Step 1: Building backend...')
run('npm install --include=dev', 'backend')
run('npx prisma generate', 'backend')
run('npx tsc', 'backend')

// Step 2: Build frontend
console.log('\n⚛️  Step 2: Building frontend...')
run('node ./node_modules/vite/bin/vite.js build')

// Step 3: Copy files
console.log('\n📋 Step 3: Copying files...')

// Root files
cpSync(resolve('server.js'), resolve(DEPLOY_DIR, 'server.js'))

// Create .env
const envContent = `PORT=3000
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://neondb_owner:npg_o6xkj7AGwJDK@ep-orange-voice-aur4fzzm-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:npg_o6xkj7AGwJDK@ep-orange-voice-aur4fzzm.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=2b83abcc07ed401b23fff63cb06ca816464e8b4a4110adc53640cbc97aac49f8
CSRF_SECRET=2b83abcc07ed401b23fff63cb06ca816464e8b4a4110adc53640cbc97aac49f8
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
ADMIN_EMAIL=admin@alkatraders.com
ADMIN_PASSWORD=admin123
CORS_ORIGIN=https://alkatraders.co
FRONTEND_URL=https://alkatraders.co
ADMIN_URL=https://alkatraders.co/admin
VITE_API_URL=/api
VITE_APP_VERSION=1.0.0
VITE_SITE_URL=https://alkatraders.co
VITE_FRONTEND_URL=https://alkatraders.co
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=ASQ2tItrBzRqqJg7zaL73Gl9ZyJbY1zIAsvVfJLIqZAa5GM0g90XXGnuw6lWF874ItegAY7zaJ2qGikO
PAYPAL_CLIENT_SECRET=EID62PIMoBQC8bm37-XkDWV-wdKof4_zmWwB-gHn2ShslFqp9t_r6oLcFIvvO83Ltj3Fff4auuwOO0WM
PAYPAL_WEBHOOK_ID=YOUR_PAYPAL_WEBHOOK_ID
EMAIL_FROM=noreply@alkatraders.com
RFQ_EMAIL=rfq@alkatraders.com
EMERGENCY_EMAIL=emergency@alkatraders.com
COMPANY_EMAIL=info@alkatraders.com
COMPANY_NAME=Alka Traders
COMPANY_PHONE=+91 87990 95041
WHATSAPP_NUMBER=918799095041
DEFAULT_SHIPPING_COST=25
DEFAULT_TAX_RATE=0.08
DEFAULT_CURRENCY=USD
DEFAULT_COUNTRY=AE
CLOUDINARY_URL=cloudinary://115338786795667:RRRfwp3MsqPrUota3ukI0fFeJ4A@y7up4zti
`
writeFileSync(resolve(DEPLOY_DIR, '.env'), envContent)

// Frontend build
cpSync(resolve('dist'), resolve(DEPLOY_DIR, 'frontend-dist'), { recursive: true })

// Backend directory
const backendDir = resolve(DEPLOY_DIR, 'backend')
mkdirSync(backendDir, { recursive: true })

// Copy compiled backend
cpSync(resolve('backend/dist'), resolve(backendDir, 'dist'), { recursive: true })

// Copy backend package.json (production only)
const backendPkg = JSON.parse(readFileSync(resolve('backend/package.json'), 'utf8'))
delete backendPkg.devDependencies
writeFileSync(resolve(backendDir, 'package.json'), JSON.stringify(backendPkg, null, 2))

// Copy Prisma schema
mkdirSync(resolve(backendDir, 'prisma'), { recursive: true })
cpSync(resolve('backend/prisma/schema.prisma'), resolve(backendDir, 'prisma/schema.prisma'))

// Copy Prisma client
if (existsSync(resolve('backend/node_modules/.prisma'))) {
  mkdirSync(resolve(backendDir, 'node_modules/.prisma'), { recursive: true })
  cpSync(resolve('backend/node_modules/.prisma'), resolve(backendDir, 'node_modules/.prisma'), { recursive: true })
}
if (existsSync(resolve('backend/node_modules/@prisma'))) {
  mkdirSync(resolve(backendDir, 'node_modules/@prisma'), { recursive: true })
  cpSync(resolve('backend/node_modules/@prisma'), resolve(backendDir, 'node_modules/@prisma'), { recursive: true })
}

// Create root package.json with only production deps
const rootPkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
const prodOnlyPkg = {
  name: rootPkg.name,
  version: rootPkg.version,
  private: true,
  type: "module",
  engines: rootPkg.engines,
  scripts: {
    start: "node server.js",
    "postinstall": "cd backend && npx prisma generate"
  },
  dependencies: rootPkg.dependencies
}
writeFileSync(resolve(DEPLOY_DIR, 'package.json'), JSON.stringify(prodOnlyPkg, null, 2))

// Step 4: Create ZIP using PowerShell
console.log('\n📦 Step 4: Creating ZIP file...')
try {
  run(`powershell -Command "Compress-Archive -Path '${DEPLOY_DIR}/*' -DestinationPath 'hostinger-deploy.zip' -Force"`)
} catch {
  // Fallback: just leave the folder
  console.log('\n⚠️  Could not auto-zip. The folder "hostinger-deploy" is ready.')
  console.log('   Right-click the folder and send to > Compressed (zipped) folder')
}

console.log('\n' + '='.repeat(60))
console.log('✅ DEPLOYMENT PACKAGE READY!')
console.log('='.repeat(60))
console.log(`
📁 Location: ${DEPLOY_DIR}/
📦 ZIP file: hostinger-deploy.zip

📋 STRUCTURE:
├── server.js              ← Entry point
├── package.json           ← Dependencies
├── .env                   ← Environment variables
├── frontend-dist/         ← Built React app
│   ├── index.html
│   ├── assets/
│   └── ...
└── backend/
    ├── package.json       ← Backend dependencies
    ├── prisma/
    │   └── schema.prisma
    ├── node_modules/
    │   ├── .prisma/
    │   └── @prisma/
    └── dist/
        └── server.js      ← Compiled Express server
`)
