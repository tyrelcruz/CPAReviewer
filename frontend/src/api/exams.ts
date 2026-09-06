import { apiClient } from '@/api/client'
import type { BankQuestion, ExamMode, GeneratedExamSession, SubmitExamResult } from '@/types/bank'

interface GenerateExamParams {
  subject: string
  mode: ExamMode
  itemCount: number
  center?: string
}

export async function generateExam(params: GenerateExamParams): Promise<GeneratedExamSession> {
  const { data } = await apiClient.post<GeneratedExamSession>('/api/exams/generate', params)
  return data
}

export async function getExamSession(sessionId: string): Promise<GeneratedExamSession> {
  const { data } = await apiClient.get<GeneratedExamSession>(`/api/exams/${sessionId}`)
  return data
}

export async function submitExam(
  sessionId: string,
  answers: { questionId: string; choiceId: string }[],
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
  center?: string
  page?: number
}

export async function listBankQuestions(params: ListBankQuestionsParams = {}) {
  const { data } = await apiClient.get<{ page: number; questions: BankQuestion[] }>(
    '/api/bank-questions',
    { params },
  )
  return data
}
