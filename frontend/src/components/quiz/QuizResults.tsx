import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { AnswerHistoryList } from '@/components/quiz/AnswerHistoryList'
import { ScoreProgressionChart } from '@/components/quiz/ScoreProgressionChart'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { QuizQuestion } from '@/types/quiz'

interface QuizResultsProps {
  questions: QuizQuestion[]
  answers: Record<string, string>
  elapsedMs: number
  onRetake: () => void
}

function formatDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function QuizResults({
  questions,
  answers,
  elapsedMs,
  onRetake,
}: QuizResultsProps) {
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const total = questions.length
  const score = questions.filter((q) => answers[q.id] === q.correctChoiceId).length
  const accuracy = Math.round((score / total) * 100)
  const avgSecondsPerQuestion = Math.round(elapsedMs / 1000 / total)

  const meterColor =
    accuracy >= 75
      ? 'bg-emerald-500'
      : accuracy >= 50
        ? 'bg-amber-500'
        : 'bg-destructive'

  const reviewQuestion = questions.find((q) => q.id === reviewId) ?? null
  const reviewIsCorrect =
    reviewQuestion != null && answers[reviewQuestion.id] === reviewQuestion.correctChoiceId

  const missedNumbers = questions
    .map((q, i) => ({ number: i + 1, isCorrect: answers[q.id] === q.correctChoiceId }))
    .filter((q) => !q.isCorrect)
    .map((q) => q.number)

  const answeredInOrder = questions.filter((q) => answers[q.id] !== undefined)
  let runningCorrect = 0
  const progression = answeredInOrder.map((q, i) => {
    if (answers[q.id] === q.correctChoiceId) runningCorrect++
    return { index: i + 1, accuracy: Math.round((runningCorrect / (i + 1)) * 100) }
  })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-display">Quiz complete</CardTitle>
          <CardDescription>
            {accuracy >= 75
              ? 'Passing score — nice work.'
              : 'Below the 75% passing mark — keep reviewing.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted rounded-md px-3 py-2">
              <p className="text-muted-foreground text-xs">Score</p>
              <p className="text-lg font-semibold">
                {score}/{total}
              </p>
            </div>
            <div className="bg-muted rounded-md px-3 py-2">
              <p className="text-muted-foreground text-xs">Accuracy</p>
              <p className="text-lg font-semibold">{accuracy}%</p>
            </div>
            <div className="bg-muted rounded-md px-3 py-2">
              <p className="text-muted-foreground text-xs">Time</p>
              <p className="text-lg font-semibold">{formatDuration(elapsedMs)}</p>
            </div>
          </div>

          <div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <motion.div
                className={cn('h-full rounded-full', meterColor)}
                initial={{ width: 0 }}
                animate={{ width: `${accuracy}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              ~{avgSecondsPerQuestion}s per question · 75% is the typical passing mark
            </p>
          </div>

          <ScoreProgressionChart points={progression} />

          <div>
            <div className="mb-2 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-sm bg-emerald-500" />
                Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="bg-destructive inline-block size-2.5 rounded-sm" />
                Incorrect
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {questions.map((q, i) => {
                const isCorrect = answers[q.id] === q.correctChoiceId
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setReviewId(q.id === reviewId ? null : q.id)}
                    title={`Question ${i + 1}: ${isCorrect ? 'Correct' : 'Incorrect'}`}
                    className={cn(
                      'flex size-7 items-center justify-center rounded-md text-xs font-semibold text-white transition-transform hover:scale-110',
                      isCorrect ? 'bg-emerald-500' : 'bg-destructive',
                      reviewId === q.id && 'ring-foreground ring-2 ring-offset-1',
                    )}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              {missedNumbers.length === 0
                ? 'All questions answered correctly.'
                : `Missed questions: ${missedNumbers.join(', ')}`}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="text-muted-foreground flex items-center gap-1 text-xs font-medium hover:text-foreground"
            >
              <ChevronDown
                className={cn('size-3.5 transition-transform', showHistory && 'rotate-180')}
              />
              {showHistory ? 'Hide' : 'Show'} full answer history
            </button>
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-2">
                    <AnswerHistoryList questions={questions} answers={answers} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {reviewQuestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'overflow-hidden rounded-md border px-4 py-3 text-sm',
                reviewIsCorrect
                  ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'border-destructive/50 bg-destructive/10',
              )}
            >
              <p className="font-medium">{reviewQuestion.prompt}</p>
              <p className="mt-2">
                Your answer:{' '}
                <span className={reviewIsCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-destructive'}>
                  {reviewQuestion.choices.find((c) => c.id === answers[reviewQuestion.id])?.text}
                </span>
              </p>
              {!reviewIsCorrect && (
                <p className="mt-1">
                  Correct answer:{' '}
                  <span className="text-emerald-700 dark:text-emerald-300">
                    {reviewQuestion.choices.find((c) => c.id === reviewQuestion.correctChoiceId)?.text}
                  </span>
                </p>
              )}
              <p className="text-muted-foreground mt-2">{reviewQuestion.rationale}</p>
            </motion.div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={onRetake}>Retake quiz</Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
