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

export function saveExamProgress(key: string, state: ExamProgressState): void {
  try {
    localStorage.setItem(PROGRESS_PREFIX + key, JSON.stringify(state))
  } catch {
    // localStorage unavailable (private mode, quota) — resume just won't work this session.
  }
}

export function getExamProgress(key: string): ExamProgressState | null {
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + key)
    return raw ? (JSON.parse(raw) as ExamProgressState) : null
  } catch {
    return null
  }
}

export function clearExamProgress(key: string): void {
  try {
    localStorage.removeItem(PROGRESS_PREFIX + key)
  } catch {
    // no-op
  }
}

const IN_PROGRESS_SESSION_PREFIX = 'kabis-in-progress-session:'

/** Bank exams generate a new session id each time "Start Exam" is clicked —
 * this pointer remembers the last unsubmitted session for a given
 * subject+mode card, so re-clicking "Start Exam" resumes it instead of
 * generating (and abandoning) a new one. */
export function saveInProgressSessionPointer(configKey: string, sessionId: string): void {
  try {
    localStorage.setItem(IN_PROGRESS_SESSION_PREFIX + configKey, sessionId)
  } catch {
    // no-op
  }
}

export function getInProgressSessionPointer(configKey: string): string | null {
  try {
    return localStorage.getItem(IN_PROGRESS_SESSION_PREFIX + configKey)
  } catch {
    return null
  }
}

export function clearInProgressSessionPointer(configKey: string): void {
  try {
    localStorage.removeItem(IN_PROGRESS_SESSION_PREFIX + configKey)
  } catch {
    // no-op
  }
}
