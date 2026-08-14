import { prisma, rawPrisma } from '../src/utils/prismaClient.js'

const tables = await prisma.$queryRawUnsafe(`
  SELECT table_name::text AS table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name
`)

const out = []
for (const { table_name } of tables) {
  const [row] = await rawPrisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${table_name}"`)
  out.push(`${String(table_name).padEnd(28)} ${row.n}`)
}
console.log(out.join('\n'))
await prisma.$disconnect()