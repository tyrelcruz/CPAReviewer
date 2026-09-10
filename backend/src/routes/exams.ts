import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'

import { pool } from '../db/pool.js'
import {
  isChoiceReferenceAnswer,
  isIdentificationAnswerCorrect,
  promptReferencesChoices,
} from '../lib/answerMatch.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  computeMaxSupportedItemCountForCategories,
  selectExamQuestionsByCategory,
  selectExamQuestionsByExactCounts,
  selectExamQuestionsByExactDifficultyCounts,
  type DifficultyWeights,
  type Difficulty,
} from '../lib/examGenerator.js'

export const examsRouter = Router()

type ExamMode = 'tos_simulator' | 'subject_drill'

const MAX_ITEM_COUNT = 200
const DIFFICULTIES: Difficulty[] = ['Easy', 'Moderate', 'Difficult']

/** Converts a student's exact difficulty counts into weights (count/total) for
 * the RFBT-topic-customization paths, which only support difficulty as a
 * *soft* in-category preference (selectExamQuestionsByCategory/
 * selectExamQuestionsByExactCounts), not a hard global count. */
function countsToWeights(counts: Record<Difficulty, number>, total: number): DifficultyWeights {
  if (total <= 0) return { Easy: 0, Moderate: 0, Difficult: 0 }
  return {
    Easy: (counts.Easy ?? 0) / total,
    Moderate: (counts.Moderate ?? 0) / total,
    Difficult: (counts.Difficult ?? 0) / total,
  }
}

/** Validates a { Easy, Moderate, Difficult } or { mcq, identification }-style
 * counts object: every value a non-negative integer, summing to exactly
 * `total`. Returns an error string, or null if valid. */
function validateCounts(
  counts: unknown,
  keys: string[],
  total: number,
  label: string,
): string | null {
  if (typeof counts !== 'object' || counts === null || Array.isArray(counts)) {
    return `${label} must be an object`
  }
  const record = counts as Record<string, unknown>
  let sum = 0
  for (const key of Object.keys(record)) {
    if (!keys.includes(key)) return `${label} has an unknown key "${key}"`
  }
  for (const key of keys) {
    const value = record[key]
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      return `${label}.${key} must be a non-negative integer`
    }
    sum += value
  }
  if (sum !== total) {
    return `${label} must sum to exactly ${total} (got ${sum})`
  }
  return null
}

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

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

/**
 * Synthetic subject codes that stand in for a full-length exam spanning every
 * currently-ingested subject of a board exam, rather than one real
 * `bank_questions.subject`/`tos_categories.subject` value — resolved to the
 * underlying subject list wherever pool selection or history filtering would
 * otherwise query by a single subject. "MTAP" mirrors the review-center name
 * already used for this style of full-subject mock in the ingested RMT kb
 * source material (see examType values in the kb JSON).
 */
const COMPREHENSIVE_SUBJECTS: Record<string, string[]> = {
  MTAP: ['IS', 'BB'],
}

interface PoolRow extends RowDataPacket {
  id: string
  difficulty: Difficulty
  sub_topic: string
  prompt: string
  correct_choice_text: string
  category?: string
}

type QuestionAnswerMode = 'mcq' | 'identification'
type SessionAnswerMode = QuestionAnswerMode | 'mixed'

interface SessionRow extends RowDataPacket {
  id: string
  user_id: string
  subject: string
  mode: ExamMode
  center_filter: string | null
  answer_mode: SessionAnswerMode
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
  answer_mode: QuestionAnswerMode
  acceptable_answers: string[] | null
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
  answerMode: QuestionAnswerMode
  acceptableAnswers: string[]
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
            bq.acceptable_answers, esq.position, esq.answer_mode
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
    answerMode: q.answer_mode,
    acceptableAnswers: q.acceptable_answers ?? [],
  }))
}

examsRouter.post('/generate', asyncHandler(async (req, res) => {
  const { subject, mode, itemCount, topicCounts, questionTypeCounts, difficultyCounts } = req.body ?? {}

  if (typeof subject !== 'string' || !subject) {
    res.status(400).json({ error: 'subject is required' })
    return
  }
  if (mode !== 'tos_simulator' && mode !== 'subject_drill') {
    res.status(400).json({ error: "mode must be 'tos_simulator' or 'subject_drill'" })
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

  const typeCountsError = validateCounts(
    questionTypeCounts,
    ['mcq', 'identification'],
    requestedItemCount,
    'questionTypeCounts',
  )
  if (typeCountsError) {
    res.status(400).json({ error: typeCountsError })
    return
  }
  const difficultyCountsError = validateCounts(
    difficultyCounts,
    DIFFICULTIES,
    requestedItemCount,
    'difficultyCounts',
  )
  if (difficultyCountsError) {
    res.status(400).json({ error: difficultyCountsError })
    return
  }
  const resolvedTypeCounts = questionTypeCounts as { mcq: number; identification: number }
  const resolvedDifficultyCounts = difficultyCounts as Record<Difficulty, number>

  const subjectFilter = COMPREHENSIVE_SUBJECTS[subject] ?? [subject]

  const [poolRows] = await pool.query<PoolRow[]>(
    `SELECT bq.id, bq.difficulty, bq.prompt, bc.text AS correct_choice_text, tc.sub_topic
     FROM bank_questions bq
     JOIN tos_categories tc ON tc.subject = bq.subject AND tc.tos_code = bq.tos_code
     JOIN bank_choices bc ON bc.question_id = bq.id AND bc.choice_id = bq.correct_choice_id
     WHERE tc.subject IN (?)`,
    [subjectFilter],
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
     WHERE uqh.user_id = ? AND tc.subject IN (?)`,
    [req.user!.id, subjectFilter],
  )
  const recentlySeenIds = new Set(historyRows.map((r) => r.question_id as string))

  // The official RFBT TOS category table only governs tos_simulator mode —
  // subject_drill intentionally skips the PRC blueprint weighting in favor
  // of a plain difficulty-balanced draw across the whole subject.
  const useCategoryTable = subject === 'RFBT' && mode === 'tos_simulator'

  let selected: PoolRow[]
  let notice: string | null = null

  if (useCustomTopicCounts) {
    const categorized = poolRows.map((row) => ({
      ...row,
      category: RFBT_CATEGORY_BY_SUBTOPIC[row.sub_topic] ?? '',
    }))
    const counts = topicCounts as Record<string, number>
    selected = selectExamQuestionsByExactCounts(
      categorized,
      counts,
      countsToWeights(resolvedDifficultyCounts, requestedItemCount),
      recentlySeenIds,
    )

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
      countsToWeights(resolvedDifficultyCounts, requestedItemCount),
      recentlySeenIds,
    )
    const maxSupported = computeMaxSupportedItemCountForCategories(categorized, RFBT_CATEGORY_WEIGHTS)
    notice =
      selected.length < requestedItemCount
        ? `Only ${selected.length} items could be generated at the required TOS ratio (requested ${requestedItemCount}) — the question pool doesn't yet have enough items in every RFBT TOS topic. Pool currently supports up to ${maxSupported} items at this ratio.`
        : null
  } else {
    selected = selectExamQuestionsByExactDifficultyCounts(poolRows, resolvedDifficultyCounts, recentlySeenIds)
    notice =
      selected.length < requestedItemCount
        ? `Only ${selected.length} of ${requestedItemCount} requested items could be generated — the question pool for this subject doesn't have enough items in every requested difficulty band.`
        : null
  }

  // Type split (MCQ vs identification) is independent of difficulty/topic —
  // applied as a final pass over whichever questions actually got selected.
  // A question is only eligible to become identification when BOTH:
  //  - its own prompt reads as free-recall, not choice-among-options
  //    ("which of the following..."/"...the following conditions:" — see
  //    promptReferencesChoices), and
  //  - its correct answer is itself a standalone identifiable term, not a
  //    meta-reference back to other lettered choices ("All of the above",
  //    "Both A and B", "1, 3, and 4 are correct" — see
  //    isChoiceReferenceAnswer), which is inherently untypeable without
  //    having seen the option list regardless of how the stem is phrased.
  // MCQ-eligible pool is every selected question; identification is drawn
  // only from the eligible subset, clamped to however many of those exist.
  const identificationEligible = selected.filter(
    (q) => !promptReferencesChoices(q.prompt) && !isChoiceReferenceAnswer(q.correct_choice_text),
  )
  const identificationCountForSelected = Math.min(
    resolvedTypeCounts.identification,
    identificationEligible.length,
  )
  const identificationIds = new Set(
    shuffleArray(identificationEligible)
      .slice(0, identificationCountForSelected)
      .map((q) => q.id),
  )
  const answerModeById = new Map<string, QuestionAnswerMode>()
  for (const question of selected) {
    answerModeById.set(question.id, identificationIds.has(question.id) ? 'identification' : 'mcq')
  }
  const actualIdentificationCount = identificationIds.size
  const actualMcqCount = selected.length - actualIdentificationCount

  if (actualIdentificationCount < resolvedTypeCounts.identification) {
    const shortfallNotice = `Only ${actualIdentificationCount} of ${resolvedTypeCounts.identification} requested identification items could be assigned — the rest of the selected questions are phrased as multiple-choice or have an answer that references other choices ("All of the above", "Both A and B", etc.) and stayed as choice-based questions instead.`
    notice = notice ? `${notice} ${shortfallNotice}` : shortfallNotice
  }

  const sessionAnswerMode: SessionAnswerMode =
    actualMcqCount > 0 && actualIdentificationCount > 0
      ? 'mixed'
      : actualIdentificationCount > 0
        ? 'identification'
        : 'mcq'

  const sessionId = randomUUID()
  await pool.query(
    `INSERT INTO exam_sessions (id, user_id, subject, mode, answer_mode, item_count)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sessionId, req.user!.id, subject, mode, sessionAnswerMode, selected.length],
  )

  if (selected.length > 0) {
    // Batched into one round-trip instead of one INSERT per question — with
    // 70-110 questions per exam, a sequential per-row loop here was the
    // actual cause of multi-second exam generation (confirmed: ~110ms per
    // question, scaling linearly with item count).
    await pool.query(
      `INSERT INTO exam_session_questions (session_id, question_id, position, answer_mode) VALUES ?`,
      [
        selected.map((question, index) => [
          sessionId,
          question.id,
          index,
          answerModeById.get(question.id) ?? 'mcq',
        ]),
      ],
    )
  }

  const questions = await fetchSessionQuestions(sessionId)
  res.status(201).json({
    sessionId,
    subject,
    mode,
    answerMode: sessionAnswerMode,
    itemCount: selected.length,
    notice,
    questions,
  })
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
  for (const [comprehensiveSubject, subjects] of Object.entries(COMPREHENSIVE_SUBJECTS)) {
    counts[comprehensiveSubject] = subjects.reduce((sum, s) => sum + (counts[s] ?? 0), 0)
  }
  res.json({ counts })
}))

/**
 * Lists the current user's own submitted exam sessions (most recent first) —
 * real attempt history for dashboard widgets (recent activity, score trend,
 * per-subject stats), not fabricated numbers. Registered before `/:id` so it
 * isn't swallowed by that wildcard.
 */
examsRouter.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query<SessionRow[]>(
    `SELECT * FROM exam_sessions
     WHERE user_id = ? AND submitted_at IS NOT NULL
     ORDER BY submitted_at DESC
     LIMIT 20`,
    [req.user!.id],
  )

  res.json({
    sessions: rows.map((row) => ({
      sessionId: row.id,
      subject: row.subject,
      mode: row.mode,
      itemCount: row.item_count,
      score: row.score,
      submittedAt: row.submitted_at,
    })),
  })
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
    answerMode: session.answer_mode,
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
    res.status(400).json({ error: 'answers must be an array of { questionId, choiceId } or { questionId, answerText }' })
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
  // Collected in-memory and written as one batched INSERT below instead of
  // one round-trip per answer — see the note on POST /generate's identical
  // fix for why (was the actual cause of multi-second exam generation/submit,
  // confirmed to scale linearly with item count against the cloud DB).
  const answerRows: [string, string, string | null, string | null, boolean][] = []
  for (const answer of answers) {
    const question = correctById.get(answer?.questionId)
    if (!question) continue

    // Per-question, not per-session — one exam can mix MCQ and
    // identification questions (see POST /generate's questionTypeCounts).
    if (question.answerMode === 'identification') {
      if (typeof answer.answerText !== 'string') continue
      const isCorrect = isIdentificationAnswerCorrect(
        answer.answerText,
        question.choices,
        question.correctChoiceId,
        question.acceptableAnswers,
        question.prompt,
      )
      if (isCorrect) score += 1
      answerRows.push([id, question.id, null, answer.answerText, isCorrect])
    } else {
      if (typeof answer.choiceId !== 'string') continue
      const isCorrect = answer.choiceId === question.correctChoiceId
      if (isCorrect) score += 1
      answerRows.push([id, question.id, answer.choiceId, null, isCorrect])
    }
  }

  if (answerRows.length > 0) {
    await pool.query(
      `INSERT INTO exam_answers (session_id, question_id, choice_id, answer_text, is_correct)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         choice_id = VALUES(choice_id), answer_text = VALUES(answer_text), is_correct = VALUES(is_correct)`,
      [answerRows],
    )
  }

  await pool.query(
    'UPDATE exam_sessions SET score = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?',
    [score, id],
  )

  if (questions.length > 0) {
    await pool.query(
      `INSERT INTO user_question_history (user_id, question_id)
       VALUES ?
       ON DUPLICATE KEY UPDATE last_served_at = CURRENT_TIMESTAMP`,
      [questions.map((q) => [req.user!.id, q.id])],
    )
  }

  const answeredById = new Map(
    answers.map((a: { questionId: string; choiceId?: string; answerText?: string }) => [a.questionId, a]),
  )
  res.json({
    score,
    total: questions.length,
    results: questions.map((q) => {
      const isIdentification = q.answerMode === 'identification'
      const answer = answeredById.get(q.id)
      const yourAnswer = (isIdentification ? answer?.answerText : answer?.choiceId) ?? null
      const correct = isIdentification
        ? typeof yourAnswer === 'string' &&
          isIdentificationAnswerCorrect(yourAnswer, q.choices, q.correctChoiceId, q.acceptableAnswers, q.prompt)
        : yourAnswer === q.correctChoiceId
      return {
        questionId: q.id,
        yourChoiceId: isIdentification ? null : yourAnswer,
        yourAnswerText: isIdentification ? yourAnswer : null,
        correct,
        correctChoiceId: q.correctChoiceId,
        rationale: q.rationale,
        canonicalConcept: q.canonicalConcept,
        tosCode: q.tosCode,
        topicCategory: q.topicCategory,
        subTopic: q.subTopic,
        sources: q.sources,
      }
    }),
  })
}))
