export type ExamMode = 'tos_simulator' | 'subject_drill'
export type AnswerMode = 'mcq' | 'identification'
/** Session-level label only — descriptive, not authoritative. A session can
 * mix both types; each BankQuestion carries its own `answerMode`. */
export type SessionAnswerMode = AnswerMode | 'mixed'

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
  answerMode: AnswerMode
  /** Curated alternate phrasings accepted for identification-mode grading
   * (e.g. "HBsAg" also accepting "Hepatitis B surface antigen"). */
  acceptableAnswers: string[]
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
  answerMode: SessionAnswerMode
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
