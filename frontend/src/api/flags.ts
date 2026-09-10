import { apiClient } from '@/api/client'

/** Submits a "Flag for review" report on a bank question with the learner's
 * reason — fire from Quiz.tsx once a reason is entered, distinct from the
 * per-attempt `flaggedIndices` UI state which stays purely local/resumable. */
export async function submitQuestionFlag(questionId: string, reason: string): Promise<void> {
  await apiClient.post('/api/flags', { questionId, reason })
}
