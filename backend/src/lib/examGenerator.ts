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

/**
 * Reduces each variant group in the pool to a single randomly-chosen member,
 * leaving ungrouped questions untouched.
 *
 * Every variant of a seed tests the same concept by construction, so serving
 * two of them in one exam wastes an item and tips the answer to the second.
 * Collapsing up front — rather than filtering collisions out after selection —
 * means the difficulty/category math downstream is picking from a pool that
 * already holds at most one question per concept, so it can neither create a
 * collision nor come up short from having one removed after the fact.
 *
 * Re-randomizing per call is what makes the variants earn their keep: a
 * student who retakes an exam meets a different variant of the same concept,
 * so a remembered answer letter is worthless and the concept has to be
 * re-derived. This composes with the recentlySeenIds preference downstream,
 * which then steers toward the variants they specifically haven't hit yet.
 */
export function collapseVariantGroups<T extends { id: string; variantGroupId?: string | null }>(
  pool: T[],
): T[] {
  const byGroup = new Map<string, T[]>()
  const ungrouped: T[] = []

  for (const item of pool) {
    if (!item.variantGroupId) {
      ungrouped.push(item)
      continue
    }
    const members = byGroup.get(item.variantGroupId)
    if (members) members.push(item)
    else byGroup.set(item.variantGroupId, [item])
  }

  const representatives = [...byGroup.values()].map(
    (members) => members[Math.floor(Math.random() * members.length)],
  )
  return [...ungrouped, ...representatives]
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

/**
 * Same per-bucket unseen-then-seen backfill as selectExamQuestions, but
 * driven by exact per-difficulty counts instead of weight-derived ones — no
 * ratio/rounding math needed since the caller already knows exactly how many
 * of each difficulty they want (a student's own customized split, not a
 * fixed TOS ratio). A bucket that can't fully supply its requested count
 * simply comes back short rather than skewing the other buckets.
 */
export function selectExamQuestionsByExactDifficultyCounts<T extends BankQuestionPoolItem>(
  pool: T[],
  difficultyCounts: Record<Difficulty, number>,
  recentlySeenIds: Set<string> = new Set(),
): T[] {
  const selected: T[] = []

  for (const difficulty of DIFFICULTIES) {
    const needed = difficultyCounts[difficulty] ?? 0
    if (needed <= 0) continue

    const bucket = pool.filter((q) => q.difficulty === difficulty)
    const unseen = shuffle(bucket.filter((q) => !recentlySeenIds.has(q.id)))
    const seen = shuffle(bucket.filter((q) => recentlySeenIds.has(q.id)))

    const chosen = unseen.slice(0, needed)
    if (chosen.length < needed) {
      console.warn(
        `examGenerator: only ${chosen.length}/${needed} unseen "${difficulty}" questions available — backfilling from recently-seen pool.`,
      )
      chosen.push(...seen.slice(0, needed - chosen.length))
    }

    selected.push(...chosen)
  }

  return shuffle(selected)
}

export interface CategorizedPoolItem extends BankQuestionPoolItem {
  category: string
}

/** Largest-remainder rounding, generalized to any string-keyed weight map. */
function allocateWeightedCounts(itemCount: number, weights: Record<string, number>): Record<string, number> {
  const keys = Object.keys(weights)
  const raw = keys.map((key) => ({ key, exact: itemCount * weights[key] }))
  const floored = raw.map((r) => ({ ...r, floor: Math.floor(r.exact) }))
  let allocated = floored.reduce((sum, r) => sum + r.floor, 0)
  let remainder = itemCount - allocated

  const byRemainderDesc = [...floored].sort((a, b) => (b.exact - b.floor) - (a.exact - a.floor))
  const counts = Object.fromEntries(floored.map((r) => [r.key, r.floor]))

  for (let i = 0; i < byRemainderDesc.length && remainder > 0; i++, remainder--) {
    counts[byRemainderDesc[i].key] += 1
  }

  return counts
}

/**
 * The largest itemCount for which every category bucket in the pool has
 * enough questions to satisfy its exact weighted share — the topic-ratio
 * analogue of computeMaxSupportedItemCount.
 */
export function computeMaxSupportedItemCountForCategories(
  pool: CategorizedPoolItem[],
  categoryWeights: Record<string, number>,
): number {
  let max = Infinity
  for (const [category, weight] of Object.entries(categoryWeights)) {
    if (weight <= 0) continue
    const poolCount = pool.filter((q) => q.category === category).length
    max = Math.min(max, Math.floor(poolCount / weight))
  }
  return Number.isFinite(max) ? max : 0
}

/**
 * Picks `needed` items from a single category bucket, preferring the target
 * difficulty ratio but never letting a thin/missing difficulty band zero out
 * the whole bucket the way `selectExamQuestions`'s hard clamp would — it
 * backfills from whichever difficulty is actually available. The category
 * allocation itself (from `selectExamQuestionsByCategory`) is the hard
 * constraint here; difficulty is only a best-effort preference within it.
 */
export function pickWithSoftDifficultyPreference<T extends BankQuestionPoolItem>(
  bucket: T[],
  needed: number,
  difficultyWeights: DifficultyWeights,
  recentlySeenIds: Set<string>,
): T[] {
  const targets = allocateCounts(needed, difficultyWeights)
  const selected: T[] = []
  const chosenIds = new Set<string>()

  for (const difficulty of DIFFICULTIES) {
    const want = targets[difficulty]
    if (want <= 0) continue
    const candidates = bucket.filter((q) => q.difficulty === difficulty)
    const unseen = shuffle(candidates.filter((q) => !recentlySeenIds.has(q.id)))
    const seen = shuffle(candidates.filter((q) => recentlySeenIds.has(q.id)))
    for (const q of [...unseen, ...seen].slice(0, want)) {
      selected.push(q)
      chosenIds.add(q.id)
    }
  }

  if (selected.length < needed) {
    const leftover = bucket.filter((q) => !chosenIds.has(q.id))
    const unseen = shuffle(leftover.filter((q) => !recentlySeenIds.has(q.id)))
    const seen = shuffle(leftover.filter((q) => recentlySeenIds.has(q.id)))
    selected.push(...[...unseen, ...seen].slice(0, needed - selected.length))
  }

  return shuffle(selected.slice(0, needed))
}

/**
 * Selects questions matching an official topic/category table of
 * specifications (e.g. PRC's per-topic item allocation for a subject) as the
 * primary hard constraint, then applies the difficulty ratio as a secondary,
 * best-effort preference *within* each category bucket (soft — a category
 * missing one difficulty band still gets filled from the others, rather than
 * collapsing to zero). A category bucket may still come back short of its
 * exact quota if the category itself is too small — that shortfall is
 * logged, not silently absorbed.
 */
export function selectExamQuestionsByCategory<T extends CategorizedPoolItem>(
  pool: T[],
  itemCount: number,
  categoryWeights: Record<string, number>,
  difficultyWeights: DifficultyWeights,
  recentlySeenIds: Set<string> = new Set(),
): T[] {
  const eligible = pool.filter((q) => (categoryWeights[q.category] ?? 0) > 0)
  const effectiveItemCount = Math.min(
    itemCount,
    computeMaxSupportedItemCountForCategories(eligible, categoryWeights),
  )
  const targetCounts = allocateWeightedCounts(effectiveItemCount, categoryWeights)
  const selected: T[] = []

  for (const category of Object.keys(categoryWeights)) {
    const needed = targetCounts[category]
    if (needed <= 0) continue

    const bucket = eligible.filter((q) => q.category === category)
    const chosen = pickWithSoftDifficultyPreference(bucket, needed, difficultyWeights, recentlySeenIds)
    if (chosen.length < needed) {
      console.warn(
        `examGenerator: only ${chosen.length}/${needed} questions available in category "${category}" — that category's TOS share will be under-filled.`,
      )
    }
    selected.push(...chosen)
  }

  return shuffle(selected)
}

/**
 * Selects questions using exact, caller-specified per-category counts (e.g.
 * a student overriding the official TOS table's percentages with their own
 * item counts per topic) instead of computing counts from a weight table.
 * Each category is clamped independently to whatever that category's pool
 * actually supports — one thin category running short doesn't affect any
 * other category's count.
 */
export function selectExamQuestionsByExactCounts<T extends CategorizedPoolItem>(
  pool: T[],
  categoryCounts: Record<string, number>,
  difficultyWeights: DifficultyWeights,
  recentlySeenIds: Set<string> = new Set(),
): T[] {
  const selected: T[] = []

  for (const [category, needed] of Object.entries(categoryCounts)) {
    if (needed <= 0) continue

    const bucket = pool.filter((q) => q.category === category)
    const chosen = pickWithSoftDifficultyPreference(bucket, needed, difficultyWeights, recentlySeenIds)
    if (chosen.length < needed) {
      console.warn(
        `examGenerator: only ${chosen.length}/${needed} questions available in category "${category}".`,
      )
    }
    selected.push(...chosen)
  }

  return shuffle(selected)
}
