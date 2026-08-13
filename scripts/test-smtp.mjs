#!/usr/bin/env node

/**
 * SMTP connectivity + delivery test for the Hostinger SMTP setup.
 *
 * Reads the same env vars as backend/src/services/email.ts:
 *   SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT (default 465), SMTP_SECURE (default true)
 * Falls back to backend/.env when the vars aren't in the process env, so it
 * works both locally and on the deployed backend (api.alkatraders.co).
 *
 * Usage:
 *   node scripts/test-smtp.mjs                 # verify auth + send a test email to SMTP_USER itself
 *   node scripts/test-smtp.mjs you@example.com # verify auth + send a test email to a recipient
 *   node scripts/test-smtp.mjs --verify        # only verify connection/auth, send nothing
 *
 * Exit code 0 = PASS, 1 = FAIL (never sends on failure).
 */
import { readFileSync } from 'fs'
import nodemailer from '../backend/node_modules/nodemailer/lib/nodemailer.js'

// ─── Env loading ────────────────────────────────────────────────
function loadEnv() {
  const vars = {}
  try {
    const raw = readFileSync(new URL('../backend/.env', import.meta.url), 'utf-8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) vars[m[1]] = m[2].trim().replace(/^"|"$/g, '')
    }
  } catch { /* no backend/.env — rely on process.env (deployed) */ }
  return vars
}

const fileEnv = loadEnv()
const env = (key) => process.env[key] ?? fileEnv[key]

const HOST = env('SMTP_HOST')
const USER = env('SMTP_USER')
const PASS = env('SMTP_PASS')
const PORT = Number(env('SMTP_PORT') || 465)
const SECURE = (env('SMTP_SECURE') ?? 'true') !== 'false'

const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !env(k))
if (missing.length > 0) {
  console.error('❌ FAIL — missing env vars: ' + missing.join(', '))
  console.error('   Set them in the hosting panel (api.alkatraders.co) or backend/.env')
  process.exit(1)
}

const args = process.argv.slice(2)
const verifyOnly = args.includes('--verify')
const recipient = args.find((a) => !a.startsWith('--')) || USER

console.log('════════════════════════════════════════════')
console.log('   SMTP Test — Hostinger')
console.log('════════════════════════════════════════════')
console.log(`   Host:      ${HOST}`)
console.log(`   Port:      ${PORT} (${SECURE ? 'SSL/TLS' : 'STARTTLS'})`)
console.log(`   User:      ${USER}`)
console.log(`   Recipient: ${verifyOnly ? '(none — verify only)' : recipient}`)
console.log('')

const transporter = nodemailer.createTransport({
  host: HOST,
  port: PORT,
  secure: SECURE,
  auth: { user: USER, pass: PASS },
})

// ─── Step 1: connection + auth ────────────────────────────────
try {
  await transporter.verify()
  console.log('   ✅ Step 1 — Connection + auth OK')
} catch (error) {
  console.error('   ❌ Step 1 — Connection/auth FAILED')
  console.error('')
  console.error('   ' + (error.message || String(error)))
  console.error('')
  console.error('   Common fixes:')
  console.error('   • SMTP_HOST must be smtp.hostinger.com (no https://)')
  console.error('   • SMTP_USER must be the FULL mailbox, e.g. noreply@alkatraders.co')
  console.error('   • Wrong password → 535 auth error')
  console.error('   • If port 465 times out, try SMTP_PORT=587 SMTP_SECURE=false')
  console.error('   • The mailbox must actually exist in Hostinger hPanel')
  process.exit(1)
}

if (verifyOnly) {
  console.log('')
  console.log('   ✅ PASS — SMTP connection and authentication work')
  process.exit(0)
}

// ─── Step 2: send a real test email ───────────────────────────
try {
  const info = await transporter.sendMail({
    from: `"Alka Traders SMTP Test" <${USER}>`,
    to: recipient,
    subject: 'Alka Traders — SMTP test',
    text: 'This is a test email sent from the Alka Traders backend via Hostinger SMTP. If you can read this, the email pipeline is wired up correctly.',
    html:
      '<div style="font-family:Arial,sans-serif;padding:24px">' +
      '<h2 style="color:#0f766e">✅ SMTP test successful</h2>' +
      '<p>This email was sent from the Alka Traders backend via <b>Hostinger SMTP</b>.</p>' +
      '<p>If you can read this, order / RFQ / password-reset emails will deliver.</p>' +
      '</div>',
  })
  console.log(`   ✅ Step 2 — Email sent (id: ${info.messageId})`)
  console.log('')
  console.log('   ✅ PASS — SMTP auth works AND email delivers')
  console.log('   Check the inbox of ' + recipient + ' (including spam).')
  process.exit(0)
} catch (error) {
  console.error('   ❌ Step 2 — Auth OK but delivery FAILED')
  console.error('')
  console.error('   ' + (error.message || String(error)))
  console.error('')
  console.error('   Common fixes:')
  console.error('   • Recipient address rejected → check the address is real')
  console.error('   • EMAIL_FROM must match the SMTP mailbox domain (.co, not .com)')
  console.error('   • Hostinger may require the sender to match SMTP_USER exactly')
  process.exit(1)
}
