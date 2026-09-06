import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { pool } from '../db/pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const schemaPath = path.resolve(__dirname, '../db/schema.sql')
  const sql = await readFile(schemaPath, 'utf-8')

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await pool.query(statement)
  }

  console.log(`Applied ${statements.length} statements from schema.sql.`)
  await pool.end()
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
