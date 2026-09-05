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
}

export interface QuizSet {
  id: string
  title: string
  description: string
  code?: string
  questions: QuizQuestion[]
}
