import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  Flag,
  Flame,
  Lightbulb,
  StickyNote,
  Target,
  Timer,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { CalculatorPopover } from '@/components/quiz/CalculatorPopover'
import { NotesPopover } from '@/components/quiz/NotesPopover'
import { ProgressRing } from '@/components/quiz/ProgressRing'
import { QuestionNavigator } from '@/components/quiz/QuestionNavigator'
import { QuizResults } from '@/components/quiz/QuizResults'
import { getStudyStreak } from '@/lib/streak'
import { formatClock, SECONDS_PER_QUESTION } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { QuizQuestion } from '@/types/quiz'

const STUDY_TIPS = [
  'Read each question carefully and eliminate incorrect choices before selecting your answer.',
  'Flag uncertain questions and come back to them after finishing the rest of the set.',
  'Watch for qualifier words like "except," "least," and "most likely" — they change the answer.',
  'Skim the explanation even when you get it right — it reinforces the underlying rule.',
]

interface QuizProps {
  quizSetId: string
  questions: QuizQuestion[]
  code?: string
  onBack: () => void
}

export function Quiz({ quizSetId, questions, code = 'Practice', onBack }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flaggedIndices, setFlaggedIndices] = useState<Set<number>>(new Set())
  const [explanationOverrides, setExplanationOverrides] = useState<Record<string, boolean>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [startTime, setStartTime] = useState(() => Date.now())
  const [elapsedMs, setElapsedMs] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => questions.length * SECONDS_PER_QUESTION,
  )
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [streak] = useState(() => getStudyStreak())

  const current = questions[currentIndex]
  const selectedChoiceId = answers[current?.id ?? '']
  const isAnswered = selectedChoiceId !== undefined
  const isLastQuestion = currentIndex === questions.length - 1
  const isFlagged = flaggedIndices.has(currentIndex)
  const explanationVisible = explanationOverrides[current?.id ?? ''] ?? isAnswered

  const answeredIndices = useMemo(() => {
    const set = new Set<number>()
    questions.forEach((q, i) => {
      if (answers[q.id] !== undefined) set.add(i)
    })
    return set
  }, [answers, questions])

  const correctCount = useMemo(
    () =>
      questions.filter((q, i) => answeredIndices.has(i) && answers[q.id] === q.correctChoiceId)
        .length,
    [answers, answeredIndices, questions],
  )

  const answeredCount = answeredIndices.size
  const progressPct = (answeredCount / questions.length) * 100
  const accuracyPct = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100)
  const tip = STUDY_TIPS[currentIndex % STUDY_TIPS.length]

  useEffect(() => {
    if (isComplete) return
    const interval = setInterval(() => {
      setRemainingSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval)
          setElapsedMs(Date.now() - startTime)
          setIsComplete(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isComplete, startTime])

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
    setFlaggedIndices(new Set())
    setExplanationOverrides({})
    setCurrentIndex(0)
    setIsComplete(false)
    setStartTime(Date.now())
    setRemainingSeconds(questions.length * SECONDS_PER_QUESTION)
  }

  function toggleFlag() {
    setFlaggedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(currentIndex)) next.delete(currentIndex)
      else next.add(currentIndex)
      return next
    })
  }

  function handleReviewFlagged() {
    const first = [...flaggedIndices].sort((a, b) => a - b)[0]
    if (first !== undefined) setCurrentIndex(first)
  }

  function toggleExplanation() {
    setExplanationOverrides((prev) => ({ ...prev, [current.id]: !explanationVisible }))
  }

  function toggleCalculator() {
    setNotesOpen(false)
    setCalculatorOpen((v) => !v)
  }

  function toggleNotes() {
    setCalculatorOpen(false)
    setNotesOpen((v) => !v)
  }

  if (isComplete) {
    return (
      <QuizResults
        quizSetId={quizSetId}
        code={code}
        questions={questions}
        answers={answers}
        elapsedMs={elapsedMs}
        onRetake={handleRetake}
        onBack={onBack}
      />
    )
  }

  const isCorrect = selectedChoiceId === current.correctChoiceId

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-[#3A2A1A]/10 bg-white px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#7A2323] hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to tests
        </button>

        <span className="text-sm font-bold whitespace-nowrap text-[#3A2A1A]">
          {code} — Practice Exam
        </span>

        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <span className="text-xs text-[#3A2A1A]/70">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#3A2A1A]/10">
            <motion.div
              className="h-full rounded-full bg-[#3A5A40]"
              initial={false}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={toggleCalculator}
            className={cn(
              'relative z-20 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
              calculatorOpen
                ? 'border-[#7A2323]/30 bg-[#7A2323]/10 text-[#7A2323]'
                : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
            )}
          >
            <Calculator className="size-4" />
            Calculator
          </button>
          {calculatorOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCalculatorOpen(false)} />
              <div className="absolute top-full right-0 z-20 mt-2">
                <CalculatorPopover />
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={toggleNotes}
            className={cn(
              'relative z-20 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
              notesOpen
                ? 'border-[#7A2323]/30 bg-[#7A2323]/10 text-[#7A2323]'
                : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
            )}
          >
            <StickyNote className="size-4" />
            Notes
          </button>
          {notesOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotesOpen(false)} />
              <div className="absolute top-full right-0 z-20 mt-2">
                <NotesPopover value={notes} onChange={setNotes} />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[#3A2A1A]">
          <Timer className="size-5 text-[#7A2323]" />
          <div className="leading-tight">
            <p className="text-sm font-bold whitespace-nowrap">
              {formatClock(remainingSeconds)}
            </p>
            <p className="text-[11px] text-[#3A2A1A]/60">Time Remaining</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinishNow}
          className="rounded-full bg-[#7A2323] px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90"
        >
          Finish test
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-6"
          >
            <p className="font-reading text-lg leading-snug font-semibold text-[#3A2A1A]">
              {current.prompt}
            </p>

            <div className="mt-5 flex flex-col gap-3">
              {current.choices.map((choice, i) => {
                const letter = String.fromCharCode(65 + i)
                const isSelected = choice.id === selectedChoiceId

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
                      'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors',
                      isSelected
                        ? 'border-[#E0AC48] bg-[#F7E7C4] text-[#3A2A1A]'
                        : 'border-[#3A2A1A]/10 text-[#3A2A1A]/85',
                      !isAnswered && !isSelected && 'cursor-pointer hover:bg-[#3A2A1A]/5',
                      isAnswered && !isSelected && 'opacity-60',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        isSelected
                          ? 'bg-[#E0AC48] text-[#3A2A1A]'
                          : 'border border-[#3A2A1A]/20 text-[#3A2A1A]/60',
                      )}
                    >
                      {letter}
                    </span>
                    <span className="font-reading flex-1">{choice.text}</span>
                    {isSelected && (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#7A2323] text-white">
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>

            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={cn(
                    'mt-5 overflow-hidden rounded-xl border',
                    isCorrect ? 'border-[#3A5A40]/30 bg-[#3A5A40]/5' : 'border-red-600/30 bg-red-600/5',
                  )}
                >
                  <button
                    type="button"
                    onClick={toggleExplanation}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span
                      className={cn(
                        'flex items-center gap-2 text-sm font-semibold',
                        isCorrect ? 'text-[#3A5A40]' : 'text-red-600',
                      )}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <XCircle className="size-4" />
                      )}
                      Explanation
                    </span>
                    <ChevronDown
                      className={cn(
                        'size-4 transition-transform',
                        isCorrect ? 'text-[#3A5A40]' : 'text-red-600',
                        explanationVisible && 'rotate-180',
                      )}
                    />
                  </button>
                  {explanationVisible && (
                    <div className="px-4 pb-4 text-sm text-[#3A2A1A]/80">
                      <p
                        className={cn(
                          'font-semibold',
                          isCorrect ? 'text-[#3A5A40]' : 'text-red-600',
                        )}
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </p>
                      <p className="font-reading mt-1">{current.rationale}</p>
                      {current.reference && (
                        <p className="mt-2 text-xs text-[#3A2A1A]/60">
                          <span className="font-semibold text-[#3A2A1A]">Reference:</span>{' '}
                          {current.reference}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between border-t border-[#3A2A1A]/10 pt-5">
              <button
                type="button"
                onClick={toggleFlag}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors',
                  isFlagged
                    ? 'border-[#E0AC48] bg-[#E0AC48]/15 text-[#B4791F]'
                    : 'border-[#3A2A1A]/20 text-[#3A2A1A]/70 hover:bg-[#3A2A1A]/5',
                )}
              >
                <Flag className="size-3.5" />
                {isFlagged ? 'Flagged' : 'Flag for review'}
              </button>
              <button
                type="button"
                onClick={toggleExplanation}
                disabled={!isAnswered}
                className="flex items-center gap-1.5 rounded-full border border-[#3A2A1A]/20 px-4 py-2 text-xs font-semibold text-[#3A2A1A]/70 transition-colors hover:bg-[#3A2A1A]/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Eye className="size-3.5" />
                View explanation
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!isAnswered}
                className="flex items-center gap-1.5 rounded-full bg-[#7A2323] px-5 py-2.5 text-xs font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLastQuestion ? 'See results' : 'Next question'}
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        <QuestionNavigator
          total={questions.length}
          currentIndex={currentIndex}
          answeredIndices={answeredIndices}
          flaggedIndices={flaggedIndices}
          onJump={setCurrentIndex}
          onReviewFlagged={handleReviewFlagged}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-[#3A2A1A]/10 bg-white p-6 sm:grid-cols-3">
          <div className="flex items-center gap-4">
            <ProgressRing
              percent={progressPct}
              size={72}
              thickness={7}
              color="#7A2323"
              trackColor="#3A2A1A1A"
              centerColor="#FFFFFF"
            >
              <span className="text-sm font-bold text-[#3A2A1A]">
                {Math.round(progressPct)}%
              </span>
            </ProgressRing>
            <div>
              <p className="text-xs font-semibold text-[#3A2A1A]/70">Overall Progress</p>
              <p className="text-sm font-semibold text-[#3A2A1A]">
                {answeredCount} of {questions.length}
              </p>
              <p className="text-xs text-[#3A2A1A]/60">Questions answered</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-[#3A2A1A]/10 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
            <Flame className="size-8 shrink-0 text-[#7A2323]" />
            <div>
              <p className="text-xs font-semibold text-[#3A2A1A]/70">Study Streak</p>
              <p className="text-lg font-bold text-[#3A2A1A]">{streak} days</p>
              <p className="text-xs text-[#3A2A1A]/60">Keep it up!</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-[#3A2A1A]/10 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
            <Target className="size-8 shrink-0 text-[#3A5A40]" />
            <div>
              <p className="text-xs font-semibold text-[#3A2A1A]/70">Accuracy</p>
              <p className="text-lg font-bold text-[#3A2A1A]">{accuracyPct}%</p>
              <p className="text-xs text-[#3A2A1A]/60">
                {correctCount} / {answeredCount} correct
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E0AC48]/30 bg-[#FBEED2] p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#7A2323]">
            <Lightbulb className="size-4" />
            Study Tip
          </p>
          <p className="font-reading mt-2 text-sm text-[#3A2A1A]/80">{tip}</p>
          <p className="font-baybayin mt-4 text-2xl text-[#3A5A40]/70" aria-hidden="true">
            pasa
          </p>
        </div>
      </div>
    </div>
  )
}
