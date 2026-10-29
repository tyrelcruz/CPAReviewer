import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'

import { pool } from '../db/pool.js'
import { collapseVariantGroups } from '../lib/examGenerator.js'
import { COMPREHENSIVE_SUBJECTS, resolveSubjectFilter } from '../lib/subjects.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

export const trialRouter = Router()

/** Fixed server-side. A client-supplied count is never honoured — the whole
 * point of the trial is that its size is not negotiable from the browser. */
const TRIAL_QUESTION_COUNT = 10

/** How many explanations a guest gets to read before the signup wall. The
 * remaining questions' rationales are stripped from the payload rather than
 * hidden in the UI, because Quiz reveals an explanation inline the moment a
 * question is answered — a client-side lock would leak all ten. */
const TRIAL_UNLOCKED_EXPLANATIONS = 2

/**
 * This is the app's only unauthenticated data route, so it carries its own
 * crude per-IP limiter — CLAUDE.md §6 flags the absence of rate limiting as a
 * known gap, and a public question-bank endpoint shouldn't widen it. Per
 * process and lost on restart, which is fine for a single container; it would
 * need a shared store (Redis, or a DB table) the day this runs more than one.
 */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
// Deliberately loose. A whole review centre or school can share one NATed IP,
// so this is sized to stop bulk scraping of the bank (200 questions/hour at
// most), not to ration honest first-time visitors.
const RATE_LIMIT_MAX_EXAMS = 20
const examStartsByIp = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (examStartsByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX_EXAMS) {
    examStartsByIp.set(ip, recent)
    return true
  }

  recent.push(now)
  examStartsByIp.set(ip, recent)

  // Nothing else ever prunes this map, so evict the IPs whose windows have
  // fully elapsed while we're already walking a request.
  if (examStartsByIp.size > 1000) {
    for (const [key, times] of examStartsByIp) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) examStartsByIp.delete(key)
    }
  }

  return false
}

async function subjectPoolCounts(): Promise<Record<string, number>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT subject, COUNT(*) as c FROM bank_questions GROUP BY subject',
  )
  const counts: Record<string, number> = {}
  for (const row of rows) {
    counts[row.subject as string] = Number(row.c)
  }
  for (const [comprehensiveSubject, subjects] of Object.entries(COMPREHENSIVE_SUBJECTS)) {
    counts[comprehensiveSubject] = subjects.reduce((sum, s) => sum + (counts[s] ?? 0), 0)
  }
  return counts
}

/** Public counterpart of /api/exams/subject-counts — lets the logged-out
 * picker show real pool sizes and grey out a subject with nothing ingested
 * yet. */
trialRouter.get('/subjects', asyncHandler(async (_req, res) => {
  const counts = await subjectPoolCounts()
  res.json({
    subjects: Object.entries(counts)
      .filter(([, available]) => available > 0)
      .map(([code, available]) => ({ code, available })),
    questionCount: TRIAL_QUESTION_COUNT,
    unlockedExplanations: TRIAL_UNLOCKED_EXPLANATIONS,
  })
}))

interface TrialPoolRow extends RowDataPacket {
  id: string
  variant_group_id: string | null
  /** camelCase mirror of variant_group_id — collapseVariantGroups is a pure
   * helper in lib/ and reads the domain shape, not the DB column name. */
  variantGroupId?: string | null
}

interface TrialQuestionRow extends RowDataPacket {
  id: string
  prompt: string
  correct_choice_id: string
  rationale: string
  difficulty: string
  cognitive_level: string
  tos_code: string
  topic_category: string
  sub_topic: string
}

interface TrialChoiceRow extends RowDataPacket {
  question_id: string
  choice_id: string
  text: string
}

trialRouter.post('/exam', asyncHandler(async (req, res) => {
  const { subject } = req.body ?? {}

  if (typeof subject !== 'string' || !subject) {
    res.status(400).json({ error: 'subject is required' })
    return
  }

  const counts = await subjectPoolCounts()
  if (!(counts[subject] > 0)) {
    res.status(400).json({ error: 'Unknown subject' })
    return
  }

  if (isRateLimited(req.ip ?? 'unknown')) {
    res.status(429).json({ error: 'Too many free exams started. Please sign up to keep going.' })
    return
  }

  const subjectFilter = resolveSubjectFilter(subject)

  const [poolRows] = await pool.query<TrialPoolRow[]>(
    `SELECT bq.id, bq.variant_group_id
     FROM bank_questions bq
     JOIN tos_categories tc ON tc.subject = bq.subject AND tc.tos_code = bq.tos_code
     WHERE tc.subject IN (?)`,
    [subjectFilter],
  )

  // One concept, one question — same reason the real generator collapses
  // first: two phrasings of the same item would waste a tenth of the trial.
  const candidates = collapseVariantGroups(
    poolRows.map((row) => ({ ...row, variantGroupId: row.variant_group_id })),
  )

  if (candidates.length === 0) {
    res.status(404).json({ error: 'No questions available for this subject yet' })
    return
  }

  const picked: string[] = []
  const remaining = candidates.map((c) => c.id)
  while (picked.length < TRIAL_QUESTION_COUNT && remaining.length > 0) {
    const [id] = remaining.splice(Math.floor(Math.random() * remaining.length), 1)
    picked.push(id)
  }

  const [questionRows] = await pool.query<TrialQuestionRow[]>(
    `SELECT bq.id, bq.prompt, bq.correct_choice_id, bq.rationale, bq.difficulty,
            bq.cognitive_level, bq.tos_code, tc.topic_category, tc.sub_topic
     FROM bank_questions bq
     JOIN tos_categories tc ON tc.subject = bq.subject AND tc.tos_code = bq.tos_code
     WHERE bq.id IN (?)`,
    [picked],
  )

  const [choiceRows] = await pool.query<TrialChoiceRow[]>(
    `SELECT question_id, choice_id, text FROM bank_choices
     WHERE question_id IN (?) ORDER BY position ASC`,
    [picked],
  )
  const choicesByQuestion = new Map<string, { id: string; text: string }[]>()
  for (const c of choiceRows) {
    const list = choicesByQuestion.get(c.question_id) ?? []
    list.push({ id: c.choice_id, text: c.text })
    choicesByQuestion.set(c.question_id, list)
  }

  const byId = new Map(questionRows.map((row) => [row.id, row]))

  res.json({
    subject,
    unlockedExplanations: TRIAL_UNLOCKED_EXPLANATIONS,
    questions: picked.flatMap((id, index) => {
      const row = byId.get(id)
      if (!row) return []
      const locked = index >= TRIAL_UNLOCKED_EXPLANATIONS
      return [
        {
          id: row.id,
          prompt: row.prompt,
          choices: choicesByQuestion.get(row.id) ?? [],
          correctChoiceId: row.correct_choice_id,
          // Withheld server-side, not merely hidden: the locked text is the
          // thing a guest is being asked to sign up for.
          rationale: locked ? '' : row.rationale,
          explanationLocked: locked,
          difficulty: row.difficulty,
          cognitiveLevel: row.cognitive_level,
          tosCode: row.tos_code,
          topicCategory: row.topic_category,
          subTopic: row.sub_topic,
          answerMode: 'mcq' as const,
        },
      ]
    }),
  })
}))
