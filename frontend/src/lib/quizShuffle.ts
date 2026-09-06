import { shuffleArray } from '@/lib/utils'
import type { QuizQuestion } from '@/types/quiz'

/**
 * Shuffles question order for a fresh attempt without breaking apart
 * scenario-based chains (questions sharing a `scenarioId`, e.g. several
 * items tied to one case study). Each chain is treated as a single unit —
 * its internal order never changes — while chains and standalone questions
 * are shuffled freely against each other.
 */
export function shuffleQuestionsKeepingChains(questions: QuizQuestion[]): QuizQuestion[] {
  const chains: QuizQuestion[][] = []
  const chainIndexByScenario = new Map<string, number>()

  for (const question of questions) {
    if (question.scenarioId) {
      const existingIndex = chainIndexByScenario.get(question.scenarioId)
      if (existingIndex !== undefined) {
        chains[existingIndex].push(question)
        continue
      }
      chainIndexByScenario.set(question.scenarioId, chains.length)
    }
    chains.push([question])
  }

  return shuffleArray(chains).flat()
}
