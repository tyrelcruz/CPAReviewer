export type Difficulty = 'Easy' | 'Moderate' | 'Difficult'

export interface DifficultyWeights {
  Easy: number
  Moderate: number
  Difficult: number
}

export interface BankQuestionPoolItem {
  id: string
  difficulty: Difficulty
}

const DIFFICULTIES: Difficulty[] = ['Easy', 'Moderate', 'Difficult']

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/** Largest-remainder rounding so per-difficulty counts sum exactly to itemCount. */
function allocateCounts(itemCount: number, weights: DifficultyWeights): Record<Difficulty, number> {
  const raw = DIFFICULTIES.map((d) => ({ difficulty: d, exact: itemCount * weights[d] }))
  const floored = raw.map((r) => ({ ...r, floor: Math.floor(r.exact) }))
  let allocated = floored.reduce((sum, r) => sum + r.floor, 0)
  let remainder = itemCount - allocated

  const byRemainderDesc = [...floored].sort((a, b) => (b.exact - b.floor) - (a.exact - a.floor))
  const counts = Object.fromEntries(floored.map((r) => [r.difficulty, r.floor])) as Record<Difficulty, number>

  for (let i = 0; i < byRemainderDesc.length && remainder > 0; i++, remainder--) {
    counts[byRemainderDesc[i].difficulty] += 1
  }

  return counts
}

/**
 * The largest itemCount for which every difficulty bucket in the pool has
 * enough questions to satisfy its exact weighted share — i.e. the ceiling
 * past which the TOS ratio can no longer be honored as a hard constraint.
 */
export function computeMaxSupportedItemCount(
  pool: BankQuestionPoolItem[],
  weights: DifficultyWeights,
): number {
  let max = Infinity
  for (const difficulty of DIFFICULTIES) {
    const weight = weights[difficulty]
    if (weight <= 0) continue
    const poolCount = pool.filter((q) => q.difficulty === difficulty).length
    max = Math.min(max, Math.floor(poolCount / weight))
  }
  return Number.isFinite(max) ? max : 0
}

/**
 * Selects questions from pool matching the target difficulty ratio exactly
 * (hard constraint) — clamping the requested itemCount down to whatever the
 * smallest difficulty bucket can actually support, rather than silently
 * under-filling that bucket and skewing the ratio. Prefers questions not in
 * recentlySeenIds within each difficulty bucket (anti-repetition, soft
 * constraint — only relaxed if a bucket doesn't have enough unseen items).
 */
export function selectExamQuestions<T extends BankQuestionPoolItem>(
  pool: T[],
  itemCount: number,
  difficultyWeights: DifficultyWeights,
  recentlySeenIds: Set<string> = new Set(),
): T[] {
  const effectiveItemCount = Math.min(itemCount, computeMaxSupportedItemCount(pool, difficultyWeights))
  const targetCounts = allocateCounts(effectiveItemCount, difficultyWeights)
  const selected: T[] = []

  for (const difficulty of DIFFICULTIES) {
    const needed = targetCounts[difficulty]
    if (needed <= 0) continue

    const bucket = pool.filter((q) => q.difficulty === difficulty)
    const unseen = shuffle(bucket.filter((q) => !recentlySeenIds.has(q.id)))
    const seen = shuffle(bucket.filter((q) => recentlySeenIds.has(q.id)))

    const chosen = unseen.slice(0, needed)
    if (chosen.length < needed) {
      console.warn(
        `examGenerator: only ${chosen.length}/${needed} unseen "${difficulty}" questions available — backfilling from recently-seen pool to preserve TOS ratio.`,
      )
      chosen.push(...seen.slice(0, needed - chosen.length))
    }

    selected.push(...chosen)
  }

  return shuffle(selected)
}
