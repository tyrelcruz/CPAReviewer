/**
 * Grades a typed (identification-mode) answer against a bank question's
 * correct choice text. Many correct choices in this bank are full phrases
 * ("Both a and b are correct"), not single terms, so a byte-exact match
 * would be needlessly harsh — this normalizes whitespace/case/punctuation
 * and tolerates a small number of character-level typos proportional to the
 * answer's length, rather than requiring perfect recall of exact wording.
 */

function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
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

export function isAnswerMatch(typed: string, correct: string): boolean {
  const a = normalizeAnswer(typed)
  const b = normalizeAnswer(correct)
  if (!a) return false
  if (a === b) return true

  const tolerance = Math.max(1, Math.floor(b.length * 0.15))
  return levenshteinDistance(a, b) <= tolerance
}
