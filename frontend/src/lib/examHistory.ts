export interface SectionScore {
  section: string
  correct: number
  total: number
}

export interface ExamAttempt {
  date: string
  correct: number
  total: number
  elapsedMs: number
  sectionScores: SectionScore[]
  /** Full per-question answers + the exact question order used, so "Review
   * Results" can redisplay this exact attempt instead of starting a new one.
   * Optional — attempts recorded before this field existed won't have it. */
  answers?: Record<string, string>
  questionOrder?: string[]
}

const HISTORY_PREFIX = 'kabis-exam-history:'
const MAX_HISTORY = 10

// Keyed by (userId, quizSetId) — this data lives in the browser's shared
// localStorage, not scoped to an account server-side, so without the user id
// in the key a second account signing in on the same browser would inherit
// the first account's "completed"/"in progress" state.
function historyKey(userId: string, quizSetId: string) {
  return `${HISTORY_PREFIX}${userId}:${quizSetId}`
}

export function getExamHistory(userId: string, quizSetId: string): ExamAttempt[] {
  try {
    const raw = localStorage.getItem(historyKey(userId, quizSetId))
    return raw ? (JSON.parse(raw) as ExamAttempt[]) : []
  } catch {
    return []
  }
}

/** Appends a completed attempt to this quiz set's history and returns the updated log. */
export function recordExamAttempt(
  userId: string,
  quizSetId: string,
  attempt: ExamAttempt,
): ExamAttempt[] {
  try {
    const next = [...getExamHistory(userId, quizSetId), attempt].slice(-MAX_HISTORY)
    localStorage.setItem(historyKey(userId, quizSetId), JSON.stringify(next))
    return next
  } catch {
    return [attempt]
  }
}

export interface AggregatedExamStats {
  examsTaken: number
  averageScore: number | null
  bestScore: number | null
}

/** Aggregates real attempt history across every quiz set — no fabricated numbers. */
export function getAggregatedExamStats(userId: string, quizSetIds: string[]): AggregatedExamStats {
  const attempts = quizSetIds.flatMap((id) => getExamHistory(userId, id))
  if (attempts.length === 0) {
    return { examsTaken: 0, averageScore: null, bestScore: null }
  }
  const scores = attempts.map((a) => (a.correct / a.total) * 100)
  const averageScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
  const bestScore = Math.round(Math.max(...scores))
  return { examsTaken: attempts.length, averageScore, bestScore }
}
