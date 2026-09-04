import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { QuizResults } from '@/components/quiz/QuizResults'
import { cn } from '@/lib/utils'
import type { QuizQuestion } from '@/types/quiz'

interface QuizProps {
  questions: QuizQuestion[]
}

export function Quiz({ questions }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [startTime, setStartTime] = useState(() => Date.now())
  const [elapsedMs, setElapsedMs] = useState(0)

  const current = questions[currentIndex]
  const selectedChoiceId = answers[current?.id ?? '']
  const isAnswered = selectedChoiceId !== undefined
  const isLastQuestion = currentIndex === questions.length - 1

  function handleSelect(choiceId: string) {
    if (isAnswered) return
    setAnswers((prev) => ({ ...prev, [current.id]: choiceId }))
  }

  function handleNext() {
    if (isLastQuestion) {
      setElapsedMs(Date.now() - startTime)
      setIsComplete(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  function handleFinishNow() {
    setElapsedMs(Date.now() - startTime)
    setIsComplete(true)
  }

  function handleRetake() {
    setAnswers({})
    setCurrentIndex(0)
    setIsComplete(false)
    setStartTime(Date.now())
  }

  if (isComplete) {
    return (
      <QuizResults
        questions={questions}
        answers={answers}
        elapsedMs={elapsedMs}
        onRetake={handleRetake}
      />
    )
  }

  const isCorrect = selectedChoiceId === current.correctChoiceId

  return (
    <Card className="w-full max-w-lg overflow-hidden">
      <CardHeader>
        <CardDescription>
          Question {currentIndex + 1} of {questions.length}
        </CardDescription>
        <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
          <motion.div
            className="bg-primary h-full rounded-full"
            initial={false}
            animate={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </CardHeader>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <CardContent className="flex flex-col gap-2">
            <CardTitle className="font-reading mb-1 text-lg leading-snug font-medium">
              {current.prompt}
            </CardTitle>
            {current.choices.map((choice, i) => {
              const isSelected = choice.id === selectedChoiceId
              const isChoiceCorrect = choice.id === current.correctChoiceId

              return (
                <motion.button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelect(choice.id)}
                  disabled={isAnswered}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  whileHover={!isAnswered ? { scale: 1.01 } : undefined}
                  whileTap={!isAnswered ? { scale: 0.99 } : undefined}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors',
                    !isAnswered &&
                      'cursor-pointer hover:bg-accent hover:text-accent-foreground',
                    isAnswered && !isChoiceCorrect && !isSelected && 'opacity-50',
                    isAnswered &&
                      isChoiceCorrect &&
                      'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
                    isAnswered &&
                      isSelected &&
                      !isChoiceCorrect &&
                      'border-destructive bg-destructive/10 text-foreground',
                  )}
                >
                  <span>{choice.text}</span>
                  {isAnswered && isChoiceCorrect && (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {isAnswered && isSelected && !isChoiceCorrect && (
                    <XCircle className="size-4 shrink-0 text-destructive" />
                  )}
                </motion.button>
              )
            })}

            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={cn(
                    'mt-2 rounded-md border px-4 py-3 text-sm',
                    isCorrect
                      ? 'border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
                      : 'border-destructive/50 bg-destructive/10 text-foreground',
                  )}
                >
                  <p className="mb-1 font-medium">
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </p>
                  <p className="text-muted-foreground">{current.rationale}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </motion.div>
      </AnimatePresence>
      <CardFooter className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleFinishNow}>
          Finish now
        </Button>
        <Button onClick={handleNext} disabled={!isAnswered}>
          {isLastQuestion ? 'See results' : 'Next question'}
        </Button>
      </CardFooter>
    </Card>
  )
}
