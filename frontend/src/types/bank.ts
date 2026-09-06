export type ExamMode = 'tos_simulator' | 'review_center_drill'

export interface BankQuestionSource {
  center: string
}

export interface BankQuestion {
  id: string
  prompt: string
  choices: { id: string; text: string }[]
  correctChoiceId: string
  rationale: string
  canonicalConcept: string
  difficulty: 'Easy' | 'Moderate' | 'Difficult'
  cognitiveLevel: string
  tosCode: string
  topicCategory: string
  subTopic: string
  sources: BankQuestionSource[]
}

export interface RfbtTopic {
  category: string
  weightPct: number
  available: number
}

export interface GeneratedExamSession {
  sessionId: string
  subject: string
  mode: ExamMode
  centerFilter?: string | null
  itemCount: number
  score?: number | null
  submitted?: boolean
  notice?: string | null
  questions: BankQuestion[]
}

export interface SubmitExamResult {
  score: number
  total: number
}
