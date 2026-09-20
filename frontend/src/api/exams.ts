import { apiClient } from '@/api/client'
import type {
  BankQuestion,
  ExamMode,
  GeneratedExamSession,
  SubmitExamResult,
  TosTopic,
} from '@/types/bank'

interface GenerateExamParams {
  subject: string
  mode: ExamMode
  /** Required unless topicCounts is provided. */
  itemCount?: number
  /** tos_simulator mode on a subject with a TOS blueprint (RFBT, TAX) only —
   * overrides the blueprint's default percentages with exact per-topic counts. */
  topicCounts?: Record<string, number>
  /** Must sum to the effective item count (itemCount, or the topicCounts sum). */
  questionTypeCounts: { mcq: number; identification: number }
  /** Must sum to the effective item count. */
  difficultyCounts: { Easy: number; Moderate: number; Difficult: number }
}

export async function generateExam(params: GenerateExamParams): Promise<GeneratedExamSession> {
  const { data } = await apiClient.post<GeneratedExamSession>('/api/exams/generate', params)
  return data
}

/** Empty for a subject with no PRC table yet — no topic customization there. */
export async function listTosTopics(subject: string): Promise<TosTopic[]> {
  const { data } = await apiClient.get<{ topics: TosTopic[] }>('/api/exams/tos-topics', {
    params: { subject },
  })
  return data.topics
}

export async function listSubjectCounts(): Promise<Record<string, number>> {
  const { data } = await apiClient.get<{ counts: Record<string, number> }>(
    '/api/exams/subject-counts',
  )
  return data.counts
}

export interface ExamSessionSummary {
  sessionId: string
  subject: string
  mode: ExamMode
  itemCount: number
  score: number
  submittedAt: string
}

/** The current user's own submitted bank-exam sessions, most recent first. */
export async function listMyExamSessions(): Promise<ExamSessionSummary[]> {
  const { data } = await apiClient.get<{ sessions: ExamSessionSummary[] }>('/api/exams')
  return data.sessions
}

export async function getExamSession(sessionId: string): Promise<GeneratedExamSession> {
  const { data } = await apiClient.get<GeneratedExamSession>(`/api/exams/${sessionId}`)
  return data
}

export async function submitExam(
  sessionId: string,
  answers: { questionId: string; choiceId?: string; answerText?: string }[],
): Promise<SubmitExamResult> {
  const { data } = await apiClient.post<SubmitExamResult>(`/api/exams/${sessionId}/submit`, {
    answers,
  })
  return data
}

interface ListBankQuestionsParams {
  subject?: string
  tosCode?: string
  difficulty?: string
  cognitiveLevel?: string
  page?: number
}

export async function listBankQuestions(params: ListBankQuestionsParams = {}) {
  const { data } = await apiClient.get<{ page: number; questions: BankQuestion[] }>(
    '/api/bank-questions',
    { params },
  )
  return data
}
