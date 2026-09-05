const STREAK_STORAGE_KEY = 'kabis-study-streak'

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

/** Reads/bumps a localStorage-backed daily study streak. Call once per session. */
export function getStudyStreak(): number {
  try {
    const today = todayKey()
    const raw = localStorage.getItem(STREAK_STORAGE_KEY)
    const state: StreakState | null = raw ? JSON.parse(raw) : null

    if (!state) {
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify({ lastDate: today, streak: 1 }))
      return 1
    }
    if (state.lastDate === today) return state.streak

    const streak = state.lastDate === yesterdayKey() ? state.streak + 1 : 1
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify({ lastDate: today, streak }))
    return streak
  } catch {
    return 1
  }
}

/** Reads the current streak without bumping it — safe to call multiple times per session. */
export function peekStudyStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY)
    const state: StreakState | null = raw ? JSON.parse(raw) : null
    return state?.streak ?? 1
  } catch {
    return 1
  }
}
