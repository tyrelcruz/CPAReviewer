import { apiClient } from '@/api/client'

export interface QuestionFlagInput {
  questionId: string
  reason: string
  /** One of the question's own choice ids — set when the learner believes a
   * listed choice is the correct one. Mutually exclusive with suggestedAnswerText. */
  suggestedChoiceId?: string
  /** A correct answer the learner believes isn't among the listed choices at all. */
  suggestedAnswerText?: string
}

/** Submits a "Flag for review" report on a bank question with the learner's
 * reason (and optionally what they think the correct answer is) — fire from
 * Quiz.tsx once a reason is entered, distinct from the per-attempt
 * `flaggedIndices` UI state which stays purely local/resumable. */
export async function submitQuestionFlag(input: QuestionFlagInput): Promise<void> {
  await apiClient.post('/api/flags', input)
}
