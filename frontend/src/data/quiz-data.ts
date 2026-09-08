import type { QuizSet } from '@/types/quiz'

// No legacy static quiz sets remain here: the previous "AT Preweek B51" and
// "RFBT Final Exam" sets were built from transcribed review-center preboard
// exam content and were removed for copyright reasons. The question-bank
// system (backend bank_questions, see api/exams.ts) is the replacement path
// for originally-authored content.
export const quizSets: QuizSet[] = []
