import { apiClient } from '@/api/client'
import type { QuizQuestion } from '@/types/quiz'

/** The logged-out trial's question shape. Narrower than BankQuestion — the
 * backend withholds `rationale` for the locked tail and omits everything the
 * trial UI doesn't render. */
export interface TrialQuestion extends QuizQuestion {
  difficulty: 'Easy' | 'Moderate' | 'Difficult'
  cognitiveLevel: string
  answerMode: 'mcq'
}

export interface TrialSubject {
  code: string
  available: number
}

export interface TrialSubjectsResponse {
  subjects: TrialSubject[]
  questionCount: number
  unlockedExplanations: number
}

export interface TrialExam {
  subject: string
  unlockedExplanations: number
  questions: TrialQuestion[]
}

/** Public — no Authorization header required (see backend routes/trial.ts). */
export async function listTrialSubjects(): Promise<TrialSubjectsResponse> {
  const { data } = await apiClient.get<TrialSubjectsResponse>('/api/trial/subjects')
  return data
}

export async function startTrialExam(subject: string): Promise<TrialExam> {
  const { data } = await apiClient.post<TrialExam>('/api/trial/exam', { subject })
  return data
}
