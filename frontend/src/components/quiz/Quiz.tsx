import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
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
import { useEffect, useMemo, useRef, useState } from 'react'

import { submitQuestionFlag } from '@/api/flags'
import { AnswerControls } from '@/components/quiz/AnswerControls'
import { CalculatorPopover } from '@/components/quiz/CalculatorPopover'
import { DrawingNotesPanel } from '@/components/quiz/DrawingNotesPanel'
import { FlagReasonPopover } from '@/components/quiz/FlagReasonPopover'
import { NotesPopover } from '@/components/quiz/NotesPopover'
import { ProgressRing } from '@/components/quiz/ProgressRing'
import { QuestionNavigator } from '@/components/quiz/QuestionNavigator'
import { QuestionPromptText } from '@/components/quiz/QuestionPromptText'
import { QuizResults } from '@/components/quiz/QuizResults'
import { useAuth } from '@/context/AuthContext'
import { isIdentificationAnswerCorrect } from '@/lib/answerMatch'
import { clearExamProgress, getExamProgress, saveExamProgress } from '@/lib/examProgress'
import { shuffleQuestionsKeepingChains } from '@/lib/quizShuffle'
import { getStudyStreak } from '@/lib/streak'
import { formatClock, SECONDS_PER_QUESTION } from '@/lib/time'
import { cn, hasRealSourceCenter } from '@/lib/utils'
import type { QuizQuestion } from '@/types/quiz'

// Minimum horizontal drag (px) that counts as a swipe rather than a scroll/tap.
const SWIPE_THRESHOLD_PX = 60

const STUDY_TIPS = [
  'Read each question carefully and eliminate incorrect choices before selecting your answer.',
  'Flag uncertain questions and come back to them after finishing the rest of the set.',
  'Watch for qualifier words like "except," "least," and "most likely" — they change the answer.',
  'Skim the explanation even when you get it right — it reinforces the underlying rule.',
]

const ANSWER_MODE_LABELS: Record<'mcq' | 'identification', string> = {
  mcq: 'Multiple Choice',
  identification: 'Identification',
}

interface QuizProps {
  quizSetId: string
  questions: QuizQuestion[]
  code?: string
  onBack: () => void
  /** Fires once when the attempt is finished — lets a caller persist the score server-side. */
  onComplete?: (answers: Record<string, string>) => void
  /** Overrides the default `questions.length * SECONDS_PER_QUESTION` countdown, e.g. from a chosen quiz-setup time limit. */
  timeLimitSeconds?: number
  /** Unique per attempt (not just per quiz set/subject) — enables pause/resume via
   * localStorage. Navigating away persists progress under this key; returning to
   * the same key picks up right where the learner left off, timer included. */
  progressKey?: string
}

/** mcq: exact choice-id match (unchanged). identification: the typed text is
 * graded leniently against the correct choice's own text (or its reference
 * letter, or a curated alt phrasing), since there's no dedicated
 * identification-authored content — see lib/answerMatch.ts. */
function isCorrectAnswer(
  question: QuizQuestion,
  answer: string | undefined,
  answerMode: 'mcq' | 'identification',
): boolean {
  if (answer === undefined) return false
  if (answerMode === 'identification') {
    return isIdentificationAnswerCorrect(
      answer,
      question.choices,
      question.correctChoiceId,
      question.acceptableAnswers ?? [],
      question.prompt,
    )
  }
  return answer === question.correctChoiceId
}

export function Quiz({
  quizSetId,
  questions: orderedQuestions,
  code = 'Practice',
  onBack,
  onComplete,
  timeLimitSeconds,
  progressKey,
}: QuizProps) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const savedProgress = useMemo(
    () => (progressKey ? getExamProgress(userId, progressKey) : null),
    // Only ever read once, on mount, for this attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Shuffled once per attempt (and reshuffled on retake) so the answer to
  // "question 5" isn't something a repeat test-taker can just memorize.
  // Scenario chains (shared scenarioId) are kept intact and in order. A
  // resumed attempt reuses its saved order instead of reshuffling, so saved
  // indices/flags still point at the right questions.
  const [questions, setQuestions] = useState(() => {
    if (savedProgress) {
      const byId = new Map(orderedQuestions.map((q) => [q.id, q]))
      const restored = savedProgress.questionOrder
        .map((id) => byId.get(id))
        .filter((q): q is QuizQuestion => q !== undefined)
      if (restored.length === orderedQuestions.length) return restored
    }
    return shuffleQuestionsKeepingChains(orderedQuestions)
  })
  const [currentIndex, setCurrentIndex] = useState(savedProgress?.currentIndex ?? 0)
  const [answers, setAnswers] = useState<Record<string, string>>(savedProgress?.answers ?? {})
  // In-progress typed text for the current identification-mode question —
  // separate from `answers` since it isn't committed (and graded) until
  // the learner submits it, unlike an MCQ click which commits immediately.
  const [draftAnswer, setDraftAnswer] = useState('')
  const [flaggedIndices, setFlaggedIndices] = useState<Set<number>>(
    () => new Set(savedProgress?.flaggedIndices ?? []),
  )
  const [explanationOverrides, setExplanationOverrides] = useState<Record<string, boolean>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [startTime, setStartTime] = useState(() => Date.now())
  const [elapsedMs, setElapsedMs] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => savedProgress?.remainingSeconds ?? timeLimitSeconds ?? questions.length * SECONDS_PER_QUESTION,
  )
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [flagPopoverOpen, setFlagPopoverOpen] = useState(false)
  const [streak] = useState(() => getStudyStreak(userId))
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Persists on every change so leaving mid-attempt (back button, closing the
  // tab, navigating to another page) never loses progress — the effect
  // cleanup below also fires on unmount, covering in-app navigation.
  useEffect(() => {
    if (!progressKey || isComplete) return
    saveExamProgress(userId, progressKey, {
      questionOrder: questions.map((q) => q.id),
      currentIndex,
      answers,
      flaggedIndices: [...flaggedIndices],
      remainingSeconds,
      savedAt: new Date().toISOString(),
    })
  }, [userId, progressKey, isComplete, questions, currentIndex, answers, flaggedIndices, remainingSeconds])

  // Once finished, this attempt's saved progress is no longer "in progress".
  useEffect(() => {
    if (isComplete && progressKey) clearExamProgress(userId, progressKey)
  }, [isComplete, progressKey, userId])

  const current = questions[currentIndex]
  const selectedChoiceId = answers[current?.id ?? '']
  const isAnswered = selectedChoiceId !== undefined
  const isLastQuestion = currentIndex === questions.length - 1
  // Sync automatically: navigating to an already-answered question shows what
  // was typed; navigating to a fresh one starts blank.
  useEffect(() => {
    setDraftAnswer(current?.id ? (answers[current.id] ?? '') : '')
    setFlagPopoverOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])
  const isFlagged = flaggedIndices.has(currentIndex)
  const explanationVisible = explanationOverrides[current?.id ?? ''] ?? isAnswered

  const answeredIndices = useMemo(() => {
    const set = new Set<number>()
    questions.forEach((q, i) => {
      if (answers[q.id] !== undefined) set.add(i)
    })
    return set
  }, [answers, questions])

  const correctIndices = useMemo(() => {
    const set = new Set<number>()
    questions.forEach((q, i) => {
      if (answeredIndices.has(i) && isCorrectAnswer(q, answers[q.id], q.answerMode ?? 'mcq')) set.add(i)
    })
    return set
  }, [answers, answeredIndices, questions])

  const correctCount = correctIndices.size

  // "Variants" grouping: questions sharing a TOS sub-topic are practice
  // variations of the same rule (different numbers/wording) — surfaced so
  // practice reads as repeated application, not rote memorization.
  const variantInfo = useMemo(() => {
    if (!current?.tosCode) return null
    const group = questions.filter((q) => q.tosCode === current.tosCode)
    if (group.length <= 1) return null
    return { index: group.findIndex((q) => q.id === current.id) + 1, total: group.length }
  }, [questions, current])

  const visibleSources = useMemo(
    () => current?.sources?.filter((s) => hasRealSourceCenter(s.center)) ?? [],
    [current],
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

  useEffect(() => {
    if (isComplete) onComplete?.(answers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete])

  // Desktop shortcut: Enter / → advances once the current question is
  // answered, mirroring the disabled state of the "Next question" button.
  useEffect(() => {
    if (isComplete) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter' && e.key !== 'ArrowRight') return
      // The calculator popover's own Enter-to-equal shortcut takes over
      // while it's open, so this shouldn't also advance the question.
      if (calculatorOpen) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (target?.isContentEditable) return
      if (!isAnswered) return
      e.preventDefault()
      handleNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, isAnswered, currentIndex, questions, calculatorOpen])

  function handleSelect(choiceId: string) {
    if (isAnswered) return
    setAnswers((prev) => ({ ...prev, [current.id]: choiceId }))
  }

  function handleTypeAnswer() {
    if (isAnswered || !draftAnswer.trim()) return
    setAnswers((prev) => ({ ...prev, [current.id]: draftAnswer.trim() }))
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
    setQuestions(shuffleQuestionsKeepingChains(orderedQuestions))
    setAnswers({})
    setFlaggedIndices(new Set())
    setExplanationOverrides({})
    setCurrentIndex(0)
    setIsComplete(false)
    setStartTime(Date.now())
    setRemainingSeconds(timeLimitSeconds ?? orderedQuestions.length * SECONDS_PER_QUESTION)
  }

  // Un-flagging needs no reason and happens immediately; flagging opens the
  // reason popover first (see FlagReasonPopover) — a report without a reason
  // isn't actionable for whoever reviews it in the admin flagged-questions list.
  function handleFlagButtonClick() {
    if (isFlagged) {
      setFlaggedIndices((prev) => {
        const next = new Set(prev)
        next.delete(currentIndex)
        return next
      })
      return
    }
    setFlagPopoverOpen(true)
  }

  // Awaited (not fire-and-forget) — a flag has no local fallback the way an
  // exam score does, so the "Flagged" indicator must only appear once the
  // report actually reached the backend. A rejection propagates to
  // FlagReasonPopover, which keeps itself open and shows an error instead.
  async function handleSubmitFlag(reason: string) {
    if (!current?.id) return
    await submitQuestionFlag(current.id, reason)
    setFlaggedIndices((prev) => new Set(prev).add(currentIndex))
    setFlagPopoverOpen(false)
  }

  function handleReviewFlagged() {
    const first = [...flaggedIndices].sort((a, b) => a - b)[0]
    if (first !== undefined) setCurrentIndex(first)
  }

  function toggleExplanation() {
    setExplanationOverrides((prev) => ({ ...prev, [current.id]: !explanationVisible }))
  }

  // Mobile gesture: swipe left on the question card advances once answered,
  // mirroring the keyboard shortcut and the disabled "Next question" button.
  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start || !isAnswered) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (dx < -SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) handleNext()
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

  const currentAnswerMode = current.answerMode ?? 'mcq'
  const isCorrect = isCorrectAnswer(current, selectedChoiceId, currentAnswerMode)

  // Some seeded questions carry only a placeholder rationale ("Answer not
  // provided in source material") — showing that verbatim reads as if we
  // don't even know the right answer. Fall back to naming the correct
  // choice instead of the raw placeholder sentence.
  const hasRealRationale = Boolean(
    current.rationale && !/answer not provided in source material/i.test(current.rationale),
  )
  const correctChoiceIndex = current.choices.findIndex((c) => c.id === current.correctChoiceId)
  const correctChoiceText = correctChoiceIndex >= 0 ? current.choices[correctChoiceIndex].text : null
  // Identification mode never showed a lettered choice list, so referencing
  // "correct answer: B" would be meaningless — name the answer text instead.
  const correctChoiceLetter =
    currentAnswerMode === 'identification'
      ? correctChoiceText
      : correctChoiceIndex >= 0
        ? String.fromCharCode(65 + correctChoiceIndex)
        : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[#3A2A1A]/10 bg-white px-4 py-3 sm:gap-x-8 sm:gap-y-4 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#7A2323] hover:underline"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to tests</span>
        </button>

        <span className="hidden text-sm font-bold whitespace-nowrap text-[#3A2A1A] sm:inline">
          {code} — Practice Exam
        </span>

        <div className="order-last flex w-full min-w-40 flex-1 flex-col gap-1.5 sm:order-0 sm:w-auto">
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
            aria-label="Calculator"
            className={cn(
              'relative z-20 flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors sm:px-3',
              calculatorOpen
                ? 'border-[#7A2323]/30 bg-[#7A2323]/10 text-[#7A2323]'
                : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
            )}
          >
            <Calculator className="size-4" />
            <span className="hidden sm:inline">Calculator</span>
          </button>
          <AnimatePresence>
            {calculatorOpen && <CalculatorPopover onClose={() => setCalculatorOpen(false)} />}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={toggleNotes}
            aria-label="Notes"
            className={cn(
              'relative z-20 flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors sm:px-3',
              notesOpen
                ? 'border-[#7A2323]/30 bg-[#7A2323]/10 text-[#7A2323]'
                : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
            )}
          >
            <StickyNote className="size-4" />
            <span className="hidden sm:inline">Notes</span>
          </button>
          {notesOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotesOpen(false)} />
              <div className="fixed inset-x-4 bottom-4 z-20 sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:right-0 sm:mt-2">
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
            <p className="hidden text-[11px] text-[#3A2A1A]/60 sm:block">Time Remaining</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinishNow}
          className="rounded-full bg-[#7A2323] px-4 py-2 text-xs font-semibold whitespace-nowrap text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90 sm:px-5 sm:py-2.5 sm:text-sm"
        >
          Finish test
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem_20rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="min-w-0 rounded-2xl border border-[#3A2A1A]/10 bg-white p-4 sm:p-6"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#3A2A1A]/10 px-2.5 py-1 text-[10px] font-bold whitespace-nowrap text-[#3A2A1A] uppercase">
                {ANSWER_MODE_LABELS[currentAnswerMode]}
              </span>
              {visibleSources.map((s) => (
                <span
                  key={s.center}
                  className="rounded-full bg-[#3A5A40]/10 px-2.5 py-1 text-[10px] font-bold whitespace-nowrap text-[#3A5A40] uppercase"
                >
                  {s.center}
                </span>
              ))}
              {current.section && (
                <span className="rounded-full bg-[#7A2323]/10 px-2.5 py-1 text-[10px] font-bold whitespace-nowrap text-[#7A2323] uppercase">
                  {current.section}
                </span>
              )}
              {variantInfo && (
                <span className="rounded-full bg-[#E0AC48]/15 px-2.5 py-1 text-[10px] font-bold whitespace-nowrap text-[#B4791F] uppercase">
                  Variant {variantInfo.index} of {variantInfo.total}
                  {current.subTopic ? ` — ${current.subTopic}` : ''}
                </span>
              )}
            </div>

            <QuestionPromptText
              text={current.prompt}
              className="font-reading text-lg leading-snug font-semibold text-[#3A2A1A]"
            />

            <div className="mt-5">
              <AnswerControls
                prompt={current.prompt}
                answerMode={currentAnswerMode}
                choices={current.choices}
                selectedChoiceId={selectedChoiceId}
                isAnswered={isAnswered}
                isCorrect={isCorrect}
                draftAnswer={draftAnswer}
                onDraftChange={setDraftAnswer}
                onSelectChoice={handleSelect}
                onSubmitTypedAnswer={handleTypeAnswer}
              />
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
                        {correctChoiceLetter && !isCorrect && ` — correct answer: ${correctChoiceLetter}`}
                      </p>
                      <p className="font-reading mt-1">
                        {hasRealRationale
                          ? current.rationale
                          : correctChoiceLetter
                            ? `The correct choice is ${correctChoiceLetter}. A written explanation isn't available for this question yet.`
                            : "A written explanation isn't available for this question yet."}
                      </p>
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

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#3A2A1A]/10 pt-5">
              <div className="relative">
                <button
                  type="button"
                  onClick={handleFlagButtonClick}
                  className={cn(
                    'relative z-20 flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors sm:px-4',
                    isFlagged
                      ? 'border-[#E0AC48] bg-[#E0AC48]/15 text-[#B4791F]'
                      : 'border-[#3A2A1A]/20 text-[#3A2A1A]/70 hover:bg-[#3A2A1A]/5',
                  )}
                >
                  <Flag className="size-3.5" />
                  {isFlagged ? 'Flagged' : 'Flag for review'}
                </button>
                {flagPopoverOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFlagPopoverOpen(false)} />
                    <div className="fixed inset-x-4 bottom-4 z-20 sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:left-0 sm:mt-2">
                      <FlagReasonPopover
                        onSubmit={handleSubmitFlag}
                        onCancel={() => setFlagPopoverOpen(false)}
                      />
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={toggleExplanation}
                disabled={!isAnswered}
                className="flex items-center gap-1.5 rounded-full border border-[#3A2A1A]/20 px-3 py-2 text-xs font-semibold whitespace-nowrap text-[#3A2A1A]/70 transition-colors hover:bg-[#3A2A1A]/5 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
              >
                <Eye className="size-3.5" />
                View explanation
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!isAnswered}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#7A2323] px-5 py-2.5 text-xs font-semibold whitespace-nowrap text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {isLastQuestion ? 'See results' : 'Next question'}
                <ArrowRight className="size-3.5" />
              </button>
            </div>
            {isAnswered && !isLastQuestion && (
              <p className="mt-2 hidden text-right text-[11px] text-[#3A2A1A]/50 sm:block">
                Press Enter or → for the next question
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:contents">
          <DrawingNotesPanel
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            questionPrompt={current.prompt}
            choices={current.choices}
            onOpenCalculator={toggleCalculator}
            answerMode={currentAnswerMode}
            selectedChoiceId={selectedChoiceId}
            isAnswered={isAnswered}
            isCorrect={isCorrect}
            draftAnswer={draftAnswer}
            onDraftChange={setDraftAnswer}
            onSelectChoice={handleSelect}
            onSubmitTypedAnswer={handleTypeAnswer}
          />
          <QuestionNavigator
            total={questions.length}
            currentIndex={currentIndex}
            answeredIndices={answeredIndices}
            correctIndices={correctIndices}
            flaggedIndices={flaggedIndices}
            onJump={setCurrentIndex}
            onReviewFlagged={handleReviewFlagged}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 grid-cols-1 gap-6 rounded-2xl border border-[#3A2A1A]/10 bg-white p-4 sm:grid-cols-3 sm:p-6">
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

        <div className="rounded-2xl border border-[#E0AC48]/30 bg-[#FBEED2] p-4 sm:p-6">
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
