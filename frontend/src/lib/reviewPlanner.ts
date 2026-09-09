export type ReviewPlanEntryType = 'Review' | 'Exam' | 'Quiz' | 'Deadline'

export interface ReviewPlanEntry {
  id: string
  /** Local calendar day this entry falls on, YYYY-MM-DD (see lib/time.ts's dateKey). */
  date: string
  title: string
  type: ReviewPlanEntryType
  time?: string
  done: boolean
}

const PLANNER_PREFIX = 'kabis-review-planner:'

// Keyed by userId, same reasoning as lib/examHistory.ts — this lives in
// shared browser localStorage, not scoped to an account server-side.
function plannerKey(userId: string) {
  return `${PLANNER_PREFIX}${userId}`
}

export function getReviewPlanEntries(userId: string): ReviewPlanEntry[] {
  try {
    const raw = localStorage.getItem(plannerKey(userId))
    return raw ? (JSON.parse(raw) as ReviewPlanEntry[]) : []
  } catch {
    return []
  }
}

function saveReviewPlanEntries(userId: string, entries: ReviewPlanEntry[]) {
  try {
    localStorage.setItem(plannerKey(userId), JSON.stringify(entries))
  } catch {
    // localStorage unavailable (private mode, quota) — entries just won't persist this session.
  }
}

export function addReviewPlanEntry(
  userId: string,
  entry: Omit<ReviewPlanEntry, 'id' | 'done'>,
): ReviewPlanEntry[] {
  const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}`
  const next = [...getReviewPlanEntries(userId), { ...entry, id, done: false }]
  saveReviewPlanEntries(userId, next)
  return next
}

export function toggleReviewPlanEntryDone(userId: string, id: string): ReviewPlanEntry[] {
  const next = getReviewPlanEntries(userId).map((entry) =>
    entry.id === id ? { ...entry, done: !entry.done } : entry,
  )
  saveReviewPlanEntries(userId, next)
  return next
}

export function deleteReviewPlanEntry(userId: string, id: string): ReviewPlanEntry[] {
  const next = getReviewPlanEntries(userId).filter((entry) => entry.id !== id)
  saveReviewPlanEntries(userId, next)
  return next
}
