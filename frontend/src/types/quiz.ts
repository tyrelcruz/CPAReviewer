export interface QuizChoice {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  choices: QuizChoice[]
  correctChoiceId: string
  rationale: string
  reference?: string
  section?: string
  /**
   * Set this to the same value on every question that shares a case
   * study/passage (e.g. "Items 45-48 refer to the following information").
   * Shuffling keeps questions with the same scenarioId glued together in
   * their original relative order — only whole chains (and standalone
   * questions) get reordered against each other.
   */
  scenarioId?: string
  /** Present only for question-bank-sourced questions (see types/bank.ts). */
  tosCode?: string
  topicCategory?: string
  subTopic?: string
  bankDifficulty?: 'Easy' | 'Moderate' | 'Difficult'
  sources?: { center: string }[]
  /** Per-question — one exam can mix MCQ and identification questions.
   * Missing (legacy static quiz sets) is treated as 'mcq'. */
  answerMode?: 'mcq' | 'identification'
}

export interface QuizSet {
  id: string
  title: string
  description: string
  code?: string
  questions: QuizQuestion[]
}
