import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { pool } from '../db/pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const schemaPath = path.resolve(__dirname, '../db/schema.sql')
  const sql = await readFile(schemaPath, 'utf-8')

  // Strip `-- ...` line comments before splitting on ';' — otherwise a
  // semicolon mentioned in comment prose (documentation, not SQL) gets
  // mistaken for a statement terminator and the split breaks mid-comment.
  const sqlWithoutComments = sql
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n')

  const statements = sqlWithoutComments
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  // CREATE TABLE uses IF NOT EXISTS, but CREATE INDEX has no such guard in
  // MySQL, so re-running this against a database that already has some (or
  // all) of these indexes would otherwise abort partway through.
  let applied = 0
  let skipped = 0
  for (const statement of statements) {
    try {
      await pool.query(statement)
      applied++
    } catch (err) {
      const code = (err as { code?: string }).code
      if (
        code === 'ER_DUP_KEYNAME' ||
        code === 'ER_DUP_FIELDNAME' ||
        code === 'ER_CANT_DROP_FIELD_OR_KEY'
      ) {
        skipped++
        continue
      }
      throw err
    }
  }

  console.log(`Applied ${applied} statements, skipped ${skipped} already-applied index(es).`)
  await pool.end()
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
