import type { RowDataPacket } from 'mysql2'
import { createHash } from 'node:crypto'

import { pool } from '../db/pool.js'

export interface RawBankChoice {
  id: string
  text: string
}

export interface RawBankQuestion {
  id: string
  prompt: string
  choices: RawBankChoice[]
  correctChoiceId: string
  rationale: string
  tos: {
    subject: string
    topicCategory: string
    subTopic: string
    tosCode: string
    cognitiveLevel: string
    difficulty: string
  }
  canonicalConcept: string
  /** Curated alternate phrasings accepted for identification-mode grading —
   * see the acceptable_answers column comment in schema.sql for why this is
   * an explicit per-question list rather than an algorithmic acronym guess. */
  acceptableAnswers?: string[]
}

export interface IngestResult {
  inserted: number
  merged: number
  skipped: { id: string | null; reason: string }[]
}

interface ExistingQuestionRow extends RowDataPacket {
  id: string
  subject: string
  canonical_concept_hash: string
  rationale: string
}

interface TosCategoryRow extends RowDataPacket {
  subject: string
  tos_code: string
  topic_category: string
  sub_topic: string
}

const VALID_DIFFICULTIES = new Set(['Easy', 'Moderate', 'Difficult'])
const PLACEHOLDER_RATIONALE_PATTERN = /not provided/i

// Cloud DB round-trips (Aiven etc.) run 50-150ms+ each — a single INSERT of
// thousands of rows risks hitting max_allowed_packet, so bulk writes are
// chunked at this size rather than sent as one unbounded statement.
const BULK_CHUNK_SIZE = 500

function normalizeConcept(concept: string): string {
  return concept.trim().toLowerCase().replace(/\s+/g, ' ')
}

function hashConcept(concept: string): string {
  return createHash('sha256').update(normalizeConcept(concept)).digest('hex')
}

function isPlaceholderRationale(rationale: string): boolean {
  return !rationale.trim() || PLACEHOLDER_RATIONALE_PATTERN.test(rationale)
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

async function bulkInsert(sql: string, rows: unknown[][]): Promise<void> {
  for (const batch of chunk(rows, BULK_CHUNK_SIZE)) {
    await pool.query(sql, [batch])
  }
}

function validate(record: unknown): record is RawBankQuestion {
  if (typeof record !== 'object' || record === null) return false
  const r = record as Partial<RawBankQuestion>

  if (typeof r.id !== 'string' || !r.id) return false
  if (typeof r.prompt !== 'string' || !r.prompt) return false
  if (!Array.isArray(r.choices) || r.choices.length < 2) return false
  if (
    !r.choices.every(
      (c) => typeof c?.id === 'string' && c.id && typeof c?.text === 'string' && c.text,
    )
  ) {
    return false
  }
  if (typeof r.correctChoiceId !== 'string' || !r.correctChoiceId) return false
  if (!r.choices.some((c) => c.id === r.correctChoiceId)) return false
  if (typeof r.rationale !== 'string' || !r.rationale) return false

  if (typeof r.tos !== 'object' || r.tos === null) return false
  if (
    typeof r.tos.subject !== 'string' ||
    !r.tos.subject ||
    typeof r.tos.topicCategory !== 'string' ||
    !r.tos.topicCategory ||
    typeof r.tos.subTopic !== 'string' ||
    !r.tos.subTopic ||
    typeof r.tos.tosCode !== 'string' ||
    !r.tos.tosCode ||
    typeof r.tos.cognitiveLevel !== 'string' ||
    !r.tos.cognitiveLevel ||
    typeof r.tos.difficulty !== 'string' ||
    !VALID_DIFFICULTIES.has(r.tos.difficulty)
  ) {
    return false
  }

  if (typeof r.canonicalConcept !== 'string' || !r.canonicalConcept) return false

  if (
    r.acceptableAnswers !== undefined &&
    (!Array.isArray(r.acceptableAnswers) ||
      !r.acceptableAnswers.every((a) => typeof a === 'string' && a.trim().length > 0))
  ) {
    return false
  }

  return true
}

/**
 * Ingests raw KB question records into the question bank, deduplicating by
 * an exact match on the normalized canonicalConcept (verified viable for
 * this dataset — ~46% of RFBT questions matched verbatim across sources
 * before dedup). Fully idempotent: re-ingesting the same records is a no-op
 * past the first run.
 *
 * Batched into a handful of round-trips total (two bulk preload SELECTs, then
 * up to four bulk INSERTs) instead of ~7 sequential per-record round-trips —
 * against a cloud DB with real network latency per query, that difference is
 * minutes vs seconds regardless of how many thousand questions are ingested.
 */
export async function ingestBankQuestions(records: unknown[]): Promise<IngestResult> {
  const result: IngestResult = { inserted: 0, merged: 0, skipped: [] }

  const valid: RawBankQuestion[] = []
  for (const raw of records) {
    if (!validate(raw)) {
      const id = typeof (raw as { id?: unknown })?.id === 'string' ? (raw as { id: string }).id : null
      result.skipped.push({ id, reason: 'Malformed record: missing or invalid required fields' })
      continue
    }
    valid.push(raw)
  }
  if (valid.length === 0) return result

  const subjects = [...new Set(valid.map((r) => r.tos.subject))]

  // Preload every tos_categories row these subjects already have, so
  // resolving each record's tos_code is an in-memory map lookup instead of a
  // per-record SELECT.
  const [tosRows] = await pool.query<TosCategoryRow[]>(
    'SELECT subject, tos_code, topic_category, sub_topic FROM tos_categories WHERE subject IN (?)',
    [subjects],
  )
  const tosBySubject = new Map<string, Map<string, { topicCategory: string; subTopic: string }>>()
  for (const row of tosRows) {
    if (!tosBySubject.has(row.subject)) tosBySubject.set(row.subject, new Map())
    tosBySubject
      .get(row.subject)!
      .set(row.tos_code, { topicCategory: row.topic_category, subTopic: row.sub_topic })
  }

  const newTosRows: [string, string, string, string][] = []

  /**
   * Same disambiguation rule as before (tos_code is only unique within a
   * subject's own kb file — mint tos_code~1, ~2, ... on a mismatch), just
   * resolved against the in-memory map instead of a DB round-trip. Mutates
   * the map immediately so a later record in this same batch that reuses the
   * newly-minted code resolves consistently, matching the old sequential
   * behavior where each INSERT was visible to the next record's SELECT.
   */
  function resolveTosCode(subject: string, tosCode: string, topicCategory: string, subTopic: string): string {
    if (!tosBySubject.has(subject)) tosBySubject.set(subject, new Map())
    const subjectMap = tosBySubject.get(subject)!

    let candidate = tosCode
    let suffix = 0
    while (true) {
      const existing = subjectMap.get(candidate)
      if (!existing) {
        subjectMap.set(candidate, { topicCategory, subTopic })
        newTosRows.push([candidate, subject, topicCategory, subTopic])
        return candidate
      }
      if (existing.topicCategory === topicCategory && existing.subTopic === subTopic) {
        return candidate
      }
      suffix += 1
      candidate = `${tosCode}~${suffix}`
    }
  }

  // Preload every existing bank_questions row for these subjects, keyed by
  // (subject, canonical_concept_hash), for the same reason — dedup becomes a
  // map lookup instead of a per-record SELECT.
  const [existingQuestionRows] = await pool.query<ExistingQuestionRow[]>(
    'SELECT id, subject, canonical_concept_hash, rationale FROM bank_questions WHERE subject IN (?)',
    [subjects],
  )
  const existingByHash = new Map<string, { id: string; rationale: string }>()
  for (const row of existingQuestionRows) {
    existingByHash.set(`${row.subject}|${row.canonical_concept_hash}`, {
      id: row.id,
      rationale: row.rationale,
    })
  }

  const newQuestionRows: unknown[][] = []
  const newChoiceRows: unknown[][] = []
  const rationaleBackfills: { id: string; rationale: string }[] = []
  const acceptableAnswerUpdates: { id: string; acceptableAnswers: string[] }[] = []

  for (const record of valid) {
    const tosCode = resolveTosCode(
      record.tos.subject,
      record.tos.tosCode,
      record.tos.topicCategory,
      record.tos.subTopic,
    )

    const conceptHash = hashConcept(record.canonicalConcept)
    const key = `${record.tos.subject}|${conceptHash}`
    const existing = existingByHash.get(key)

    if (existing) {
      if (isPlaceholderRationale(existing.rationale) && !isPlaceholderRationale(record.rationale)) {
        rationaleBackfills.push({ id: existing.id, rationale: record.rationale })
        existing.rationale = record.rationale // avoid re-backfilling if this batch repeats the concept
      }
      if (record.acceptableAnswers && record.acceptableAnswers.length > 0) {
        acceptableAnswerUpdates.push({ id: existing.id, acceptableAnswers: record.acceptableAnswers })
      }
      result.merged += 1
      continue
    }

    // Register immediately so a later record in this same batch sharing the
    // same concept merges into this one instead of inserting a duplicate.
    existingByHash.set(key, { id: record.id, rationale: record.rationale })

    newQuestionRows.push([
      record.id,
      record.tos.subject,
      tosCode,
      record.tos.cognitiveLevel,
      record.tos.difficulty,
      record.prompt,
      record.correctChoiceId,
      record.rationale,
      record.canonicalConcept,
      conceptHash,
      record.acceptableAnswers && record.acceptableAnswers.length > 0
        ? JSON.stringify(record.acceptableAnswers)
        : null,
    ])
    record.choices.forEach((choice, index) => {
      newChoiceRows.push([record.id, choice.id, choice.text, index])
    })
    result.inserted += 1
  }

  // tos_categories must land before bank_questions (FK on subject+tos_code),
  // which must land before bank_choices (FK on question id).
  if (newTosRows.length > 0) {
    await bulkInsert(
      `INSERT INTO tos_categories (tos_code, subject, topic_category, sub_topic) VALUES ?`,
      newTosRows,
    )
  }
  if (newQuestionRows.length > 0) {
    await bulkInsert(
      `INSERT INTO bank_questions
         (id, subject, tos_code, cognitive_level, difficulty, prompt, correct_choice_id, rationale, canonical_concept, canonical_concept_hash, acceptable_answers)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         prompt = VALUES(prompt),
         correct_choice_id = VALUES(correct_choice_id),
         rationale = VALUES(rationale),
         acceptable_answers = VALUES(acceptable_answers)`,
      newQuestionRows,
    )
  }
  if (newChoiceRows.length > 0) {
    await bulkInsert(
      `INSERT INTO bank_choices (question_id, choice_id, text, position)
       VALUES ?
       ON DUPLICATE KEY UPDATE text = VALUES(text), position = VALUES(position)`,
      newChoiceRows,
    )
  }
  // Rare (only when backfilling a placeholder rationale, or setting curated
  // acceptable-answer aliases, on an already-merged question) — left as
  // individual statements rather than a batched CASE/WHEN.
  for (const backfill of rationaleBackfills) {
    await pool.query('UPDATE bank_questions SET rationale = ? WHERE id = ?', [
      backfill.rationale,
      backfill.id,
    ])
  }
  for (const update of acceptableAnswerUpdates) {
    await pool.query('UPDATE bank_questions SET acceptable_answers = ? WHERE id = ?', [
      JSON.stringify(update.acceptableAnswers),
      update.id,
    ])
  }

  return result
}
