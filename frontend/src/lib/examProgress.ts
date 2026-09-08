export interface ExamProgressState {
  /** Question ids in shuffled order — restored verbatim on resume so saved
   * indices/flags still point at the same questions instead of a fresh shuffle. */
  questionOrder: string[]
  currentIndex: number
  answers: Record<string, string>
  flaggedIndices: number[]
  remainingSeconds: number
  savedAt: string
}

const PROGRESS_PREFIX = 'kabis-exam-progress:'

// Keyed by (userId, key) — same reasoning as examHistory.ts: this lives in
// the browser's shared localStorage, so without the user id a second account
// on the same browser would see (and could resume into) the first account's
// in-progress attempt.
export function saveExamProgress(userId: string, key: string, state: ExamProgressState): void {
  try {
    localStorage.setItem(`${PROGRESS_PREFIX}${userId}:${key}`, JSON.stringify(state))
  } catch {
    // localStorage unavailable (private mode, quota) — resume just won't work this session.
  }
}

export function getExamProgress(userId: string, key: string): ExamProgressState | null {
  try {
    const raw = localStorage.getItem(`${PROGRESS_PREFIX}${userId}:${key}`)
    return raw ? (JSON.parse(raw) as ExamProgressState) : null
  } catch {
    return null
  }
}

export function clearExamProgress(userId: string, key: string): void {
  try {
    localStorage.removeItem(`${PROGRESS_PREFIX}${userId}:${key}`)
  } catch {
    // no-op
  }
}

const IN_PROGRESS_SESSION_PREFIX = 'kabis-in-progress-session:'

/** Bank exams generate a new session id each time "Start Exam" is clicked —
 * this pointer remembers the last unsubmitted session for a given
 * subject+mode card, so re-clicking "Start Exam" resumes it instead of
 * generating (and abandoning) a new one. */
export function saveInProgressSessionPointer(userId: string, configKey: string, sessionId: string): void {
  try {
    localStorage.setItem(`${IN_PROGRESS_SESSION_PREFIX}${userId}:${configKey}`, sessionId)
  } catch {
    // no-op
  }
}

export function getInProgressSessionPointer(userId: string, configKey: string): string | null {
  try {
    return localStorage.getItem(`${IN_PROGRESS_SESSION_PREFIX}${userId}:${configKey}`)
  } catch {
    return null
  }
}

export function clearInProgressSessionPointer(userId: string, configKey: string): void {
  try {
    localStorage.removeItem(`${IN_PROGRESS_SESSION_PREFIX}${userId}:${configKey}`)
  } catch {
    // no-op
  }
}
