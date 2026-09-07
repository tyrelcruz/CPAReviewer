import { cn } from '@/lib/utils'
import type { QuizQuestion } from '@/types/quiz'

interface AnswerHistoryListProps {
  questions: QuizQuestion[]
  answers: Record<string, string>
}

export function AnswerHistoryList({ questions, answers }: AnswerHistoryListProps) {
  return (
    <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
      {questions.map((q, i) => {
        const selectedChoiceId = answers[q.id]
        const isAnswered = selectedChoiceId !== undefined
        const isCorrect = selectedChoiceId === q.correctChoiceId
        const yourAnswerText = q.choices.find((c) => c.id === selectedChoiceId)?.text
        const correctAnswerText = q.choices.find((c) => c.id === q.correctChoiceId)?.text

        return (
          <div
            key={q.id}
            className={cn(
              'rounded-md border px-3 py-2 text-sm',
              !isAnswered
                ? 'border-border bg-muted/50'
                : isCorrect
                  ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'border-destructive/50 bg-destructive/10',
            )}
          >
            {(q.sources?.length ?? 0) > 0 && (
              <div className="mb-1 flex flex-wrap gap-1.5">
                {q.sources!.map((s) => (
                  <span
                    key={s.center}
                    className="rounded-full bg-[#3A5A40]/10 px-2 py-0.5 text-[9px] font-bold whitespace-nowrap text-[#3A5A40] uppercase"
                  >
                    {s.center}
                  </span>
                ))}
              </div>
            )}
            <p className="font-reading line-clamp-2 font-medium whitespace-pre-line">
              {i + 1}. {q.prompt}
            </p>
            <p className="mt-1">
              Your answer:{' '}
              <span
                className={cn(
                  !isAnswered
                    ? 'text-muted-foreground italic'
                    : isCorrect
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-destructive',
                )}
              >
                {yourAnswerText ?? 'Skipped'}
              </span>
            </p>
            {!isCorrect && (
              <p className="mt-1">
                Correct answer:{' '}
                <span className="text-emerald-700 dark:text-emerald-300">
                  {correctAnswerText}
                </span>
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
