import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'

import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  computeMaxSupportedItemCount,
  computeMaxSupportedItemCountForCategories,
  selectExamQuestions,
  selectExamQuestionsByCategory,
  selectExamQuestionsByExactCounts,
  type Difficulty,
} from '../lib/examGenerator.js'

export const examsRouter = Router()

type ExamMode = 'tos_simulator' | 'review_center_drill'

const DEFAULT_DIFFICULTY_WEIGHTS = { Easy: 0.3, Moderate: 0.4, Difficult: 0.3 }
const MAX_ITEM_COUNT = 200

/**
 * Official PRC table of specifications for RFBT ("RFBT MDE"): the exact
 * per-topic item allocation the TOS simulator must follow, keyed by the
 * `sub_topic` values our ingested question bank actually uses. Topics not
 * listed here (Obligations, Contracts, Sales, AMLA, etc.) sit outside this
 * table and are excluded from tos_simulator-mode selection for RFBT.
 */
const RFBT_CATEGORY_BY_SUBTOPIC: Record<string, string> = {
  Corporations: 'Revised Corp Code',
  Partnerships: 'Partnership',
  Cooperatives: 'Cooperatives',
  'Financial Rehabilitation and Insolvency Act': 'FRIA Act',
  'Labor Law': 'Labor and SSS Law',
  'Social Security Law': 'Labor and SSS Law',
  Insurance: 'Insurance',
}

const RFBT_CATEGORY_WEIGHTS: Record<string, number> = {
  'Revised Corp Code': 0.57,
  Partnership: 0.12,
  Cooperatives: 0.1,
  'FRIA Act': 0.1,
  'Labor and SSS Law': 0.06,
  Insurance: 0.05,
}

interface PoolRow extends RowDataPacket {
  id: string
  difficulty: Difficulty
  sub_topic: string
  category?: string
}

interface SessionRow extends RowDataPacket {
  id: string
  user_id: string
  subject: string
  mode: ExamMode
  center_filter: string | null
  item_count: number
  score: number | null
  started_at: string
  submitted_at: string | null
}

interface QuestionMetaRow extends RowDataPacket {
  id: string
  prompt: string
  correct_choice_id: string
  rationale: string
  canonical_concept: string
  difficulty: string
  cognitive_level: string
  tos_code: string
  topic_category: string
  sub_topic: string
  position: number
}

interface ChoiceRow extends RowDataPacket {
  question_id: string
  choice_id: string
  text: string
  position: number
}

interface SourceRow extends RowDataPacket {
  question_id: string
  center: string
}

interface SessionQuestion {
  id: string
  prompt: string
  choices: { id: string; text: string }[]
  difficulty: string
  cognitiveLevel: string
  tosCode: string
  topicCategory: string
  subTopic: string
  sources: { center: string }[]
  correctChoiceId: string
  rationale: string
  canonicalConcept: string
}

/**
 * Fetches full question data including correctChoiceId/rationale. Returned to
 * the client immediately (on generate and fetch, not gated behind submit) —
 * this app is self-study practice, not a proctored exam, and the existing
 * static quiz sets already ship their answer key client-side the same way.
 */
async function fetchSessionQuestions(sessionId: string): Promise<SessionQuestion[]> {
  const [questionRows] = await pool.query<QuestionMetaRow[]>(
    `SELECT bq.id, bq.prompt, bq.correct_choice_id, bq.rationale, bq.canonical_concept,
            bq.difficulty, bq.cognitive_level, bq.tos_code, tc.topic_category, tc.sub_topic,
            esq.position
     FROM exam_session_questions esq
     JOIN bank_questions bq ON bq.id = esq.question_id
     JOIN tos_categories tc ON tc.subject = bq.subject AND tc.tos_code = bq.tos_code
     WHERE esq.session_id = ?
     ORDER BY esq.position ASC`,
    [sessionId],
  )

  const ids = questionRows.map((q) => q.id)
  if (ids.length === 0) return []

  const [choiceRows] = await pool.query<ChoiceRow[]>(
    `SELECT question_id, choice_id, text, position FROM bank_choices WHERE question_id IN (?) ORDER BY position ASC`,
    [ids],
  )
  const [sourceRows] = await pool.query<SourceRow[]>(
    `SELECT question_id, center FROM bank_sources WHERE question_id IN (?)`,
    [ids],
  )

  const choicesByQuestion = new Map<string, { id: string; text: string }[]>()
  for (const c of choiceRows) {
    const list = choicesByQuestion.get(c.question_id) ?? []
    list.push({ id: c.choice_id, text: c.text })
    choicesByQuestion.set(c.question_id, list)
  }
  const sourcesByQuestion = new Map<string, { center: string }[]>()
  for (const s of sourceRows) {
    const list = sourcesByQuestion.get(s.question_id) ?? []
    list.push({ center: s.center })
    sourcesByQuestion.set(s.question_id, list)
  }

  return questionRows.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    choices: choicesByQuestion.get(q.id) ?? [],
    difficulty: q.difficulty,
    cognitiveLevel: q.cognitive_level,
    tosCode: q.tos_code,
    topicCategory: q.topic_category,
    subTopic: q.sub_topic,
    sources: sourcesByQuestion.get(q.id) ?? [],
    correctChoiceId: q.correct_choice_id,
    rationale: q.rationale,
    canonicalConcept: q.canonical_concept,
  }))
}

examsRouter.post('/generate', asyncHandler(async (req, res) => {
  const { subject, mode, itemCount, center, topicCounts } = req.body ?? {}

  if (typeof subject !== 'string' || !subject) {
    res.status(400).json({ error: 'subject is required' })
    return
  }
  if (mode !== 'tos_simulator' && mode !== 'review_center_drill') {
    res.status(400).json({ error: "mode must be 'tos_simulator' or 'review_center_drill'" })
    return
  }
  if (mode === 'review_center_drill' && (typeof center !== 'string' || !center)) {
    res.status(400).json({ error: 'center is required for review_center_drill mode' })
    return
  }

  // Lets a student override the official RFBT TOS percentages with their own
  // exact per-topic item counts (e.g. "give me 20 Corp Code, 5 Partnership…")
  // instead of the fixed 57/12/10/10/6/5 split.
  const useCustomTopicCounts = subject === 'RFBT' && mode === 'tos_simulator' && topicCounts !== undefined

  let requestedItemCount: number
  if (useCustomTopicCounts) {
    if (typeof topicCounts !== 'object' || topicCounts === null || Array.isArray(topicCounts)) {
      res.status(400).json({ error: 'topicCounts must be an object of category -> count' })
      return
    }
    for (const [category, count] of Object.entries(topicCounts as Record<string, unknown>)) {
      if (!(category in RFBT_CATEGORY_WEIGHTS)) {
        res.status(400).json({ error: `Unknown RFBT topic "${category}"` })
        return
      }
      if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
        res.status(400).json({ error: `topicCounts.${category} must be a non-negative integer` })
        return
      }
    }
    requestedItemCount = Object.values(topicCounts as Record<string, number>).reduce(
      (sum, n) => sum + n,
      0,
    )
    if (requestedItemCount <= 0) {
      res.status(400).json({ error: 'topicCounts must sum to at least 1' })
      return
    }
    if (requestedItemCount > MAX_ITEM_COUNT) {
      res.status(400).json({ error: `topicCounts must sum to at most ${MAX_ITEM_COUNT}` })
      return
    }
  } else {
    if (typeof itemCount !== 'number' || itemCount <= 0 || itemCount > MAX_ITEM_COUNT) {
      res.status(400).json({ error: `itemCount must be a number between 1 and ${MAX_ITEM_COUNT}` })
      return
    }
    requestedItemCount = itemCount
  }

  const conditions = ['tc.subject = ?']
  const params: unknown[] = [subject]
  if (mode === 'review_center_drill') {
    conditions.push('EXISTS (SELECT 1 FROM bank_sources bs WHERE bs.question_id = bq.id AND bs.center = ?)')
    params.push(center)
  }

  const [poolRows] = await pool.query<PoolRow[]>(
    `SELECT bq.id, bq.difficulty, tc.sub_topic
     FROM bank_questions bq
     JOIN tos_categories tc ON tc.subject = bq.subject AND tc.tos_code = bq.tos_code
     WHERE ${conditions.join(' AND ')}`,
    params,
  )

  if (poolRows.length === 0) {
    res.status(404).json({ error: 'No questions available for the requested subject/mode' })
    return
  }

  const [historyRows] = await pool.query<RowDataPacket[]>(
    `SELECT uqh.question_id
     FROM user_question_history uqh
     JOIN bank_questions bq ON bq.id = uqh.question_id
     JOIN tos_categories tc ON tc.subject = bq.subject AND tc.tos_code = bq.tos_code
     WHERE uqh.user_id = ? AND tc.subject = ?`,
    [req.user!.id, subject],
  )
  const recentlySeenIds = new Set(historyRows.map((r) => r.question_id as string))

  // The official RFBT TOS category table only governs tos_simulator mode —
  // review_center_drill intentionally scopes to one center's full question
  // set, not the PRC blueprint.
  const useCategoryTable = subject === 'RFBT' && mode === 'tos_simulator'

  let selected: PoolRow[]
  let notice: string | null = null

  if (useCustomTopicCounts) {
    const categorized = poolRows.map((row) => ({
      ...row,
      category: RFBT_CATEGORY_BY_SUBTOPIC[row.sub_topic] ?? '',
    }))
    const counts = topicCounts as Record<string, number>
    selected = selectExamQuestionsByExactCounts(categorized, counts, DEFAULT_DIFFICULTY_WEIGHTS, recentlySeenIds)

    if (selected.length < requestedItemCount) {
      const shortfalls = Object.entries(counts)
        .map(([category, needed]) => ({
          category,
          needed,
          actual: selected.filter((q) => q.category === category).length,
        }))
        .filter((s) => s.actual < s.needed)
        .map((s) => `${s.category} (${s.actual}/${s.needed})`)
      notice = `Only ${selected.length} of ${requestedItemCount} requested items could be generated — some topics don't have enough questions: ${shortfalls.join(', ')}.`
    }
  } else if (useCategoryTable) {
    const categorized = poolRows.map((row) => ({
      ...row,
      category: RFBT_CATEGORY_BY_SUBTOPIC[row.sub_topic] ?? '',
    }))
    selected = selectExamQuestionsByCategory(
      categorized,
      requestedItemCount,
      RFBT_CATEGORY_WEIGHTS,
      DEFAULT_DIFFICULTY_WEIGHTS,
      recentlySeenIds,
    )
    const maxSupported = computeMaxSupportedItemCountForCategories(categorized, RFBT_CATEGORY_WEIGHTS)
    notice =
      selected.length < requestedItemCount
        ? `Only ${selected.length} items could be generated at the required TOS ratio (requested ${requestedItemCount}) — the question pool doesn't yet have enough items in every RFBT TOS topic. Pool currently supports up to ${maxSupported} items at this ratio.`
        : null
  } else {
    selected = selectExamQuestions(poolRows, requestedItemCount, DEFAULT_DIFFICULTY_WEIGHTS, recentlySeenIds)
    const maxSupported = computeMaxSupportedItemCount(poolRows, DEFAULT_DIFFICULTY_WEIGHTS)
    notice =
      selected.length < requestedItemCount
        ? `Only ${selected.length} items could be generated at the required TOS ratio (requested ${requestedItemCount}) — the question pool for this subject/mode doesn't yet have enough items in every difficulty band. Pool currently supports up to ${maxSupported} items at this ratio.`
        : null
  }

  const sessionId = randomUUID()
  await pool.query(
    `INSERT INTO exam_sessions (id, user_id, subject, mode, center_filter, item_count)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sessionId, req.user!.id, subject, mode, mode === 'review_center_drill' ? center : null, selected.length],
  )

  for (const [index, question] of selected.entries()) {
    await pool.query(
      `INSERT INTO exam_session_questions (session_id, question_id, position) VALUES (?, ?, ?)`,
      [sessionId, question.id, index],
    )
  }

  const questions = await fetchSessionQuestions(sessionId)
  res.status(201).json({ sessionId, subject, mode, itemCount: selected.length, notice, questions })
}))

/**
 * Exposes the RFBT TOS category table (weight + how many questions are
 * actually available per category) so the client can default and clamp a
 * "customize per-topic counts" UI without hardcoding the pool sizes.
 * Registered before `/:id` — it must not be swallowed by that wildcard.
 */
examsRouter.get('/rfbt-topics', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT tc.sub_topic, COUNT(*) as c
     FROM bank_questions bq
     JOIN tos_categories tc ON tc.subject = bq.subject AND tc.tos_code = bq.tos_code
     WHERE tc.subject = 'RFBT'
     GROUP BY tc.sub_topic`,
  )

  const availableByCategory: Record<string, number> = {}
  for (const row of rows) {
    const category = RFBT_CATEGORY_BY_SUBTOPIC[row.sub_topic as string]
    if (!category) continue
    availableByCategory[category] = (availableByCategory[category] ?? 0) + Number(row.c)
  }

  const topics = Object.entries(RFBT_CATEGORY_WEIGHTS).map(([category, weightPct]) => ({
    category,
    weightPct,
    available: availableByCategory[category] ?? 0,
  }))

  res.json({ topics })
}))

/**
 * Total ingested question count per subject, so the client can show real
 * pool sizes on the exam-setup subject picker instead of hardcoded numbers.
 * Registered before `/:id` — it must not be swallowed by that wildcard.
 */
examsRouter.get('/subject-counts', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT subject, COUNT(*) as c FROM bank_questions GROUP BY subject',
  )
  const counts: Record<string, number> = {}
  for (const row of rows) {
    counts[row.subject as string] = Number(row.c)
  }
  res.json({ counts })
}))

examsRouter.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  const [sessionRows] = await pool.query<SessionRow[]>(
    'SELECT * FROM exam_sessions WHERE id = ?',
    [id],
  )
  const session = sessionRows[0]
  if (!session || session.user_id !== req.user!.id) {
    res.status(404).json({ error: 'Exam session not found' })
    return
  }

  const questions = await fetchSessionQuestions(id)
  res.json({
    sessionId: session.id,
    subject: session.subject,
    mode: session.mode,
    centerFilter: session.center_filter,
    itemCount: session.item_count,
    score: session.score,
    submitted: Boolean(session.submitted_at),
    questions,
  })
}))

examsRouter.post('/:id/submit', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { answers } = req.body ?? {}

  if (!Array.isArray(answers)) {
    res.status(400).json({ error: 'answers must be an array of { questionId, choiceId }' })
    return
  }

  const [sessionRows] = await pool.query<SessionRow[]>(
    'SELECT * FROM exam_sessions WHERE id = ?',
    [id],
  )
  const session = sessionRows[0]
  if (!session || session.user_id !== req.user!.id) {
    res.status(404).json({ error: 'Exam session not found' })
    return
  }
  if (session.submitted_at) {
    res.status(409).json({ error: 'This exam session has already been submitted' })
    return
  }

  const questions = await fetchSessionQuestions(id)
  const correctById = new Map(questions.map((q) => [q.id, q]))

  let score = 0
  for (const answer of answers) {
    const question = correctById.get(answer?.questionId)
    if (!question || typeof answer.choiceId !== 'string') continue

    const isCorrect = answer.choiceId === question.correctChoiceId
    if (isCorrect) score += 1

    await pool.query(
      `INSERT INTO exam_answers (session_id, question_id, choice_id, is_correct)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE choice_id = VALUES(choice_id), is_correct = VALUES(is_correct)`,
      [id, question.id, answer.choiceId, isCorrect],
    )
  }

  await pool.query(
    'UPDATE exam_sessions SET score = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?',
    [score, id],
  )

  for (const question of questions) {
    await pool.query(
      `INSERT INTO user_question_history (user_id, question_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE last_served_at = CURRENT_TIMESTAMP`,
      [req.user!.id, question.id],
    )
  }

  const answeredById = new Map(answers.map((a: { questionId: string; choiceId: string }) => [a.questionId, a.choiceId]))
  res.json({
    score,
    total: questions.length,
    results: questions.map((q) => ({
      questionId: q.id,
      yourChoiceId: answeredById.get(q.id) ?? null,
      correct: answeredById.get(q.id) === q.correctChoiceId,
      correctChoiceId: q.correctChoiceId,
      rationale: q.rationale,
      canonicalConcept: q.canonicalConcept,
      tosCode: q.tosCode,
      topicCategory: q.topicCategory,
      subTopic: q.subTopic,
      sources: q.sources,
    })),
  })
}))
