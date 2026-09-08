const STREAK_STORAGE_PREFIX = 'kabis-study-streak:'

interface StreakState {
  lastDate: string
  streak: number
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayKey() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
}

// Keyed per userId — otherwise a second account signing in on the same
// browser would inherit (and keep bumping) the first account's streak.
function streakKey(userId: string) {
  return `${STREAK_STORAGE_PREFIX}${userId}`
}

/** Reads/bumps a localStorage-backed daily study streak. Call once per session. */
export function getStudyStreak(userId: string): number {
  try {
    const today = todayKey()
    const raw = localStorage.getItem(streakKey(userId))
    const state: StreakState | null = raw ? JSON.parse(raw) : null

    if (!state) {
      localStorage.setItem(streakKey(userId), JSON.stringify({ lastDate: today, streak: 1 }))
      return 1
    }
    if (state.lastDate === today) return state.streak

    const streak = state.lastDate === yesterdayKey() ? state.streak + 1 : 1
    localStorage.setItem(streakKey(userId), JSON.stringify({ lastDate: today, streak }))
    return streak
  } catch {
    return 1
  }
}

/** Reads the current streak without bumping it — safe to call multiple times per session. */
export function peekStudyStreak(userId: string): number {
  try {
    const raw = localStorage.getItem(streakKey(userId))
    const state: StreakState | null = raw ? JSON.parse(raw) : null
    return state?.streak ?? 1
  } catch {
    return 1
  }
}
