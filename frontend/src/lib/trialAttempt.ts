const STORAGE_KEY = 'cpa-reviewer:trial-used'

export interface TrialAttempt {
  subject: string
  correct: number
  total: number
  completedAt: string
}

/**
 * Marks the one free exam a browser gets. This is a conversion nudge, not an
 * entitlement check — clearing storage or opening a private window resets it,
 * deliberately. Nothing of value hides behind it: the locked explanations are
 * withheld server-side regardless of what this says.
 */
export function getTrialAttempt(): TrialAttempt | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TrialAttempt>
    if (typeof parsed.subject !== 'string' || typeof parsed.total !== 'number') return null
    return parsed as TrialAttempt
  } catch {
    return null
  }
}

export function recordTrialAttempt(attempt: TrialAttempt): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
  } catch {
    // Private-mode quota failures just mean the nudge won't persist.
  }
}
