import rawAtB51 from '@/data/seeds/at-b51-raw.json'
import type { QuizQuestion, QuizSet } from '@/types/quiz'

interface RawQuizQuestion extends Omit<QuizQuestion, 'correctChoiceId'> {
  correctChoiceId: string | null
}

function isAnswered(question: RawQuizQuestion): question is QuizQuestion {
  return question.correctChoiceId !== null
}

export const atB51Quiz: QuizQuestion[] = (rawAtB51 as RawQuizQuestion[]).filter(isAnswered)

export const quizSets: QuizSet[] = [
  {
    id: 'at-preweek-b51',
    title: 'AT Preweek B51',
    description: 'Auditing Theory — preweek review, batch 51',
    questions: atB51Quiz,
  },
]
