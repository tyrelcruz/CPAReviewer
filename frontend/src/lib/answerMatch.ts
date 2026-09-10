/**
 * Grades a typed (identification-mode) answer against a bank question's
 * correct choice text. Many correct choices in this bank are full phrases
 * ("Both a and b are correct"), not single terms, so a byte-exact match
 * would be needlessly harsh — this normalizes whitespace/case/punctuation
 * and tolerates a small number of character-level typos proportional to the
 * answer's length, rather than requiring perfect recall of exact wording.
 *
 * Mirrors backend/src/lib/answerMatch.ts exactly (including
 * `isIdentificationAnswerCorrect` below) — the client-side Correct/Incorrect
 * feedback shown immediately in Quiz.tsx must agree with what the backend
 * persists on submit, and this repo has no shared build tooling between the
 * two packages (see CLAUDE.md), so it's duplicated rather than imported.
 */

function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-–—]/g, ' ') // "B-cell" and "B cell" are the same term, not a typo apart
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,;:!?'"]+$/g, '')
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const dp: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))

  for (let i = 0; i < rows; i++) dp[i][0] = i
  for (let j = 0; j < cols; j++) dp[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }

  return dp[rows - 1][cols - 1]
}

// Minimum length (post-normalization) before the containment check below
// applies — short correct answers ("AB", "O", "A1") are exactly the terms
// most likely to falsely appear as a substring of an unrelated or opposite
// answer, so they're only ever graded by exact match / typo tolerance.
const MIN_CONTAINMENT_LENGTH = 8
// How much extra text a containment match may carry beyond the shorter
// string — enough for the answer to reasonably echo a few words of the
// question's own phrasing ("...at what stage..." -> "...B cell stage"),
// not enough to swallow an unrelated clause.
const MAX_CONTAINMENT_EXTRA_CHARS = 12

// Generic category nouns a question stem often supplies itself ("...at what
// STAGE...", "...which TEST...") that a student may reasonably echo back in
// a typed answer even though the correct choice text omits them entirely
// ("latent" for a "what stage" question). Deliberately excludes any word
// that could itself BE the distinguishing content of an answer (e.g.
// "antigen"/"antibody" — stripping those could conflate two genuinely
// opposite short answers), so this only ever strips a fixed, truly-generic
// word, never arbitrary text — safe at any length, unlike the containment
// check below.
const GENERIC_TRAILING_WORDS = [
  'stage',
  'phase',
  'type',
  'method',
  'technique',
  'test',
  'assay',
  'stain',
  'staining',
  'disease',
  'syndrome',
  'condition',
  'marker',
  'reaction',
  'mechanism',
  'process',
  'pattern',
]

function stripGenericWord(s: string): string {
  for (const word of GENERIC_TRAILING_WORDS) {
    if (s.endsWith(` ${word}`)) return s.slice(0, -(word.length + 1))
    if (s.startsWith(`${word} `)) return s.slice(word.length + 1)
  }
  return s
}

// Attribution-style answers ("Gruber and Durham", "Jean Lindenmann and Alick
// Isaacs") are lists of people — a student who correctly recalls them may
// write full names where the choice text has only surnames (or vice versa),
// or simply name them in a different order, none of which should count
// against them. Narrowly matches only a correct answer that reads as
// ENTIRELY a list of 1-3-word Title Case name segments joined by "and"/","
// (nothing else, and every token at least 2 letters so lettered choice
// references like "Both A and B" can never qualify) — verified against
// every correct answer in the current kb corpus, this pattern is specific
// enough that it never fires on a generic multi-part technical answer
// (disease names, immunoglobulin lists, etc.) that happens to share a
// trailing word.
const NAME_TOKEN = "[A-Z][a-zA-Z'-]+"
const NAME_SEGMENT = `${NAME_TOKEN}(?:\\s+${NAME_TOKEN}){0,2}`
const NAME_LIST_PATTERN = new RegExp(`^${NAME_SEGMENT}(?:\\s*(?:,|and)\\s*${NAME_SEGMENT})+$`)

/** Last word of each "and"/","-separated name segment, sorted so the
 * comparison is order-independent — "Isaacs and Lindenmann" names the same
 * two people as "Lindenmann and Isaacs". */
function sortedLastNamesOfEachSegment(s: string): string {
  return s
    .split(/\s*(?:,|\band\b)\s*/i)
    .map((segment) => segment.trim().split(/\s+/).pop() ?? '')
    .filter(Boolean)
    .sort()
    .join(' ')
}

// A single titled person's name ("Dr. Charles Drew") — a student may add or
// omit a middle initial, or drop the title entirely. Narrowly requires the
// title be followed by ONLY Title Case tokens (letters, optional trailing
// period) through to the end — this deliberately excludes a correct answer
// like "Dr antigen" (a real Rh-system antigen name in this bank, not a
// person), since "antigen" is lowercase and fails this pattern.
const TITLED_NAME_PATTERN = /^(?:Dr|Mr|Mrs|Ms|Prof|Sir)\.?\s+(?:[A-Z][a-zA-Z'-]*\.?\s*)+$/
const TITLE_WORD_PATTERN = /^(?:dr|mr|mrs|ms|prof|sir)\.?$/i
const MIDDLE_INITIAL_PATTERN = /^[a-z]\.?$/i

function stripTitleAndMiddleInitials(s: string): string {
  const words = s.split(/\s+/).filter(Boolean)
  const withoutTitle = TITLE_WORD_PATTERN.test(words[0] ?? '') ? words.slice(1) : words
  return withoutTitle.filter((w) => !MIDDLE_INITIAL_PATTERN.test(w)).join(' ')
}

export function isAnswerMatch(typed: string, correct: string): boolean {
  const a = normalizeAnswer(typed)
  const b = normalizeAnswer(correct)
  if (!a) return false
  if (a === b) return true

  // No tolerance floor below 3 characters — a 1-edit allowance on a 1-2
  // character correct answer (e.g. ABO codes "A", "B", "AB", "O", "A1")
  // means literally any other single character would pass, since the entire
  // answer space at that length is one edit apart.
  const tolerance = b.length <= 2 ? 0 : Math.max(1, Math.floor(b.length * 0.15))
  if (levenshteinDistance(a, b) <= tolerance) return true

  // Accept one answer embedded in the other with only a small amount of
  // extra text — e.g. typing "immature B-cell stage" for a correct answer of
  // "Immature B cell" reasonably repeats the question's own "what stage"
  // wording rather than being a different/wrong answer.
  if (Math.min(a.length, b.length) >= MIN_CONTAINMENT_LENGTH) {
    const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
    if (longer.includes(shorter) && longer.length - shorter.length <= MAX_CONTAINMENT_EXTRA_CHARS) {
      return true
    }
  }

  // No length floor here (unlike the containment check above) — safe at any
  // length because only a literal word from the fixed list above is ever
  // stripped, so two genuinely different short terms can never collapse into
  // a false match.
  if (stripGenericWord(a) === stripGenericWord(b)) return true

  if (NAME_LIST_PATTERN.test(correct.trim())) {
    const typedSurnames = sortedLastNamesOfEachSegment(a)
    const correctSurnames = sortedLastNamesOfEachSegment(b)
    if (typedSurnames && typedSurnames === correctSurnames) return true
  }

  if (TITLED_NAME_PATTERN.test(correct.trim())) {
    const strippedA = stripTitleAndMiddleInitials(a)
    const strippedB = stripTitleAndMiddleInitials(b)
    if (strippedA && strippedA === strippedB) return true
  }

  return false
}

// Correct-choice texts in this bank are sometimes a meta-reference back to
// other lettered choices ("All of the above", "Both A and B", "1, 3, and 4
// are correct") rather than a standalone identifiable term — inherently
// impossible to type without having seen the lettered options, regardless of
// how the question stem itself is phrased. See promptReferencesChoices below
// for the complementary stem-phrasing check.
const CHOICE_REFERENCE_TEXT_PATTERN =
  /\ball of the above\b|\bnone of the above\b|\b(?:all|none)\s+of the given choices\b|\b(?:more than\s+)?\d+\s+of the given choices\b|\bboth\s+\b[a-d]\b\s+and\s+\b[a-d]\b|\b[a-d]\b\s+and\s+\b[a-d]\b\s+are correct\b|^\s*both\s*$|^\s*\d+(?:\s*,\s*\d+)*(?:\s*,?\s*and\s*\d+)?\s+are correct\b/i

export function isChoiceReferenceAnswer(text: string): boolean {
  return CHOICE_REFERENCE_TEXT_PATTERN.test(text)
}

// Most of this bank's identification-mode content was originally authored as
// MCQ stems, so every question still carries a `choices` array internally —
// but only some of those stems actually point the reader at that list
// ("Which of the following...", "...among the following conditions:"). A
// pure free-recall stem ("The manufacturer of Adsol is:") never implies a
// visible option list, so showing/accepting a reference letter for it would
// be confusing rather than helpful. Also used by Quiz.tsx to decide whether
// to render the "Reference choices" list at all.
const CHOICE_INDICATOR_PATTERN = /\bwhich\b|\bthe following\b|\bamong the following\b|\bchoose from\b|\bselect from\b/i

export function promptReferencesChoices(prompt: string): boolean {
  return CHOICE_INDICATOR_PATTERN.test(prompt)
}

/**
 * Grades a typed identification answer against a question's choices. Accepts
 * the full choice text (via `isAnswerMatch`) or any curated
 * `acceptableAnswers` alt phrasing always; additionally accepts just the
 * letter shown next to the correct choice ("A", "a.") only when `prompt`
 * itself indicates a reference list was actually shown (see
 * `promptReferencesChoices`) — otherwise a bare letter was never a
 * reasonable thing for the learner to type. Mirrors
 * backend/src/lib/answerMatch.ts.
 */
export function isIdentificationAnswerCorrect(
  typed: string,
  choices: { id: string; text: string }[],
  correctChoiceId: string,
  acceptableAnswers: string[] = [],
  prompt = '',
): boolean {
  const correctIndex = choices.findIndex((c) => c.id === correctChoiceId)
  const correctText = correctIndex >= 0 ? choices[correctIndex].text : ''
  if (isAnswerMatch(typed, correctText)) return true
  if (acceptableAnswers.some((alt) => isAnswerMatch(typed, alt))) return true
  if (correctIndex < 0 || !promptReferencesChoices(prompt)) return false

  const correctLetter = String.fromCharCode(65 + correctIndex).toLowerCase()
  return normalizeAnswer(typed) === correctLetter
}
