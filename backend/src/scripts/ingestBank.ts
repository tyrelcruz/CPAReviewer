import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { pool } from '../db/pool.js'
import { ingestBankQuestions } from '../lib/bankIngest.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_FILES = [
  '../../../frontend/src/assets/kb/rfbt/ReSA_RFBT_Final.json',
  '../../../frontend/src/assets/kb/rfbt/REO_RFBT_Final.json',
  '../../../frontend/src/assets/kb/rfbt/CPAR_RFBT_Final.json',
  '../../../frontend/src/assets/kb/rfbt/RedeFine_RFBT_Final.json',
  '../../../frontend/src/assets/kb/tax/ReSA_Tax_Final.json',
  '../../../frontend/src/assets/kb/tax/CPAR_Tax_Final.json',
  '../../../frontend/src/assets/kb/tax/Redefine_Tax_Final.json',
]

async function ingest() {
  const args = process.argv.slice(2)
  const relativePaths = args.length > 0 ? args : DEFAULT_FILES

  let inserted = 0
  let merged = 0
  const skipped: { file: string; id: string | null; reason: string }[] = []

  for (const relativePath of relativePaths) {
    const filePath = path.resolve(__dirname, relativePath)
    const raw = await readFile(filePath, 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    // Some kb files are a bare array; others wrap it as { meta, questions }.
    const records: unknown[] = Array.isArray(parsed)
      ? parsed
      : ((parsed as { questions?: unknown[] })?.questions ?? [])

    const result = await ingestBankQuestions(records)
    inserted += result.inserted
    merged += result.merged
    skipped.push(...result.skipped.map((s) => ({ file: path.basename(filePath), ...s })))

    console.log(
      `${path.basename(filePath)}: ${result.inserted} inserted, ${result.merged} merged, ${result.skipped.length} skipped`,
    )
  }

  if (skipped.length > 0) {
    console.warn('Skipped records:', skipped)
  }
  console.log(`Done. Total: ${inserted} inserted, ${merged} merged, ${skipped.length} skipped.`)
  await pool.end()
}

ingest().catch((err) => {
  console.error(err)
  process.exit(1)
})
