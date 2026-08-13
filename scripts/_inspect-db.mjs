/**
 * Temporary read-only DB inspector for the Neon production database.
 * Lists every table with its row count, then dumps all rows as JSON.
 * Usage: node scripts/_inspect-db.mjs [table]
 */
import { readFileSync } from 'fs'
import pkg from '../backend/node_modules/@neondatabase/serverless/index.js'
const { neon } = pkg

// Load DATABASE_URL from backend/.env (no quotes handling needed for this file)
const env = readFileSync(new URL('../backend/.env', import.meta.url), 'utf-8')
const m = env.match(/^DATABASE_URL=(.+)$/m)
if (!m) { console.error('DATABASE_URL not found'); process.exit(1) }
const url = m[1].trim().replace(/^"|"$/g, '')

const sql = neon(url)
const tableFilter = process.argv[2]

async function main() {
  // 1. Inventory
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`

  console.log('=== TABLES (' + tables.length + ') ===')
  for (const t of tables) {
    if (tableFilter && t.table_name !== tableFilter) continue
    const count = await sql.query(`SELECT count(*)::int AS n FROM "${t.table_name}"`)
    const cols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name=${t.table_name}
      ORDER BY ordinal_position`
    console.log(`\n--- ${t.table_name} (rows: ${count[0].n}) ---`)
    console.log('  cols:', cols.map(c => `${c.column_name}:${c.data_type}`).join(', '))
  }

  // 2. Dump rows
  for (const t of tables) {
    if (tableFilter && t.table_name !== tableFilter) continue
    const rows = await sql.query(`SELECT * FROM "${t.table_name}"`)
    if (rows.length === 0) { console.log(`\n[${t.table_name}] (empty)`); continue }
    console.log(`\n[${t.table_name}] ${rows.length} row(s):`)
    console.log(JSON.stringify(rows, null, 1))
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
