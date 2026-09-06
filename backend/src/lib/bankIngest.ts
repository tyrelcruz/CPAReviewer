import type { RowDataPacket } from 'mysql2'
import { createHash, randomUUID } from 'node:crypto'

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
  source: {
    center: string
    batch: string
    examType: string
  }
  tos: {
    subject: string
    topicCategory: string
    subTopic: string
    tosCode: string
    cognitiveLevel: string
    difficulty: string
  }
  canonicalConcept: string
}

export interface IngestResult {
  inserted: number
  merged: number
  skipped: { id: string | null; reason: string }[]
}

interface ExistingQuestionRow extends RowDataPacket {
  id: string
  rationale: string
}

const VALID_DIFFICULTIES = new Set(['Easy', 'Moderate', 'Difficult'])
const PLACEHOLDER_RATIONALE_PATTERN = /not provided/i

function normalizeConcept(concept: string): string {
  return concept.trim().toLowerCase().replace(/\s+/g, ' ')
}

function hashConcept(concept: string): string {
  return createHash('sha256').update(normalizeConcept(concept)).digest('hex')
}

function isPlaceholderRationale(rationale: string): boolean {
  return !rationale.trim() || PLACEHOLDER_RATIONALE_PATTERN.test(rationale)
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

  if (typeof r.source !== 'object' || r.source === null) return false
  if (
    typeof r.source.center !== 'string' ||
    !r.source.center ||
    typeof r.source.batch !== 'string' ||
    !r.source.batch ||
    typeof r.source.examType !== 'string' ||
    !r.source.examType
  ) {
    return false
  }

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

  return true
}

/**
 * Ingests raw KB question records into the question bank, deduplicating
 * across review centers by an exact match on the normalized canonicalConcept
 * (verified viable for this dataset — ~46% of RFBT questions match verbatim
 * across ReSA/REO). Fully idempotent: re-ingesting the same records is a
 * no-op past the first run.
 */
export async function ingestBankQuestions(records: unknown[]): Promise<IngestResult> {
  const result: IngestResult = { inserted: 0, merged: 0, skipped: [] }

  for (const raw of records) {
    if (!validate(raw)) {
      const id = typeof (raw as { id?: unknown })?.id === 'string' ? (raw as { id: string }).id : null
      result.skipped.push({ id, reason: 'Malformed record: missing or invalid required fields' })
      continue
    }

    const record = raw

    await pool.query(
      `INSERT INTO tos_categories (tos_code, subject, topic_category, sub_topic)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         subject = VALUES(subject),
         topic_category = VALUES(topic_category),
         sub_topic = VALUES(sub_topic)`,
      [record.tos.tosCode, record.tos.subject, record.tos.topicCategory, record.tos.subTopic],
    )

    const conceptHash = hashConcept(record.canonicalConcept)
    const [existingRows] = await pool.query<ExistingQuestionRow[]>(
      'SELECT id, rationale FROM bank_questions WHERE canonical_concept_hash = ? LIMIT 1',
      [conceptHash],
    )
    const existing = existingRows[0]

    if (existing) {
      if (isPlaceholderRationale(existing.rationale) && !isPlaceholderRationale(record.rationale)) {
        await pool.query('UPDATE bank_questions SET rationale = ? WHERE id = ?', [
          record.rationale,
          existing.id,
        ])
      }

      await pool.query(
        `INSERT INTO bank_sources (id, question_id, center, batch, exam_type, original_question_id)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           batch = VALUES(batch),
           exam_type = VALUES(exam_type)`,
        [
          randomUUID(),
          existing.id,
          record.source.center,
          record.source.batch,
          record.source.examType,
          record.id,
        ],
      )
      result.merged += 1
      continue
    }

    await pool.query(
      `INSERT INTO bank_questions
         (id, tos_code, cognitive_level, difficulty, prompt, correct_choice_id, rationale, canonical_concept, canonical_concept_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         prompt = VALUES(prompt),
         correct_choice_id = VALUES(correct_choice_id),
         rationale = VALUES(rationale)`,
      [
        record.id,
        record.tos.tosCode,
        record.tos.cognitiveLevel,
        record.tos.difficulty,
        record.prompt,
        record.correctChoiceId,
        record.rationale,
        record.canonicalConcept,
        conceptHash,
      ],
    )

    for (const [index, choice] of record.choices.entries()) {
      await pool.query(
        `INSERT INTO bank_choices (question_id, choice_id, text, position)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE text = VALUES(text), position = VALUES(position)`,
        [record.id, choice.id, choice.text, index],
      )
    }

    await pool.query(
      `INSERT INTO bank_sources (id, question_id, center, batch, exam_type, original_question_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         batch = VALUES(batch),
         exam_type = VALUES(exam_type)`,
      [randomUUID(), record.id, record.source.center, record.source.batch, record.source.examType, record.id],
    )
    result.inserted += 1
  }

  return result
}
