import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Flame,
  RotateCcw,
  Scale,
  Search,
  Sparkles,
  Star,
  Target,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'

import { AnswerHistoryList } from '@/components/quiz/AnswerHistoryList'
import { ExamHistoryChart, type ExamHistoryPoint } from '@/components/quiz/ExamHistoryChart'
import { ProgressRing } from '@/components/quiz/ProgressRing'
import { useAuth } from '@/context/AuthContext'
import { getExamHistory, recordExamAttempt, type SectionScore } from '@/lib/examHistory'
import { scoreBgClass } from '@/lib/score'
import { peekStudyStreak } from '@/lib/streak'
import { formatClock } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { QuizQuestion } from '@/types/quiz'

interface LegacyAttemptSummary {
  correct: number
  total: number
  elapsedMs: number
  sectionScores: SectionScore[]
}

interface QuizResultsProps {
  quizSetId: string
  code?: string
  questions: QuizQuestion[]
  answers: Record<string, string>
  elapsedMs: number
  onRetake: () => void
  onBack: () => void
  /** True when redisplaying an already-recorded attempt (e.g. "Review Results"
   * from Mock Exams) — skips writing a duplicate entry to history. */
  readOnly?: boolean
  /** Attempts recorded before per-question replay data existed only have
   * aggregate stats. When set, scores render from these stats directly
   * instead of being recomputed from `questions`/`answers` (which are empty
   * in that case), and the per-question review list is hidden. */
  summaryOnly?: LegacyAttemptSummary
}

const PASSING_SCORE = 75
const GENERAL_SECTION = 'General'

const SECTION_ICONS: Record<string, LucideIcon> = {
  'Professional Responsibilities & Ethics': Scale,
  'Engagement Planning & Risk Assessment': ClipboardList,
  'Audit Evidence & Procedures': Search,
  'Completing the Audit & Reporting': FileText,
}

function iconForSection(section: string): LucideIcon {
  return SECTION_ICONS[section] ?? FileText
}

function formatMinSec(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function QuizResults({
  quizSetId,
  code = 'Practice',
  questions,
  answers,
  elapsedMs,
  onRetake,
  onBack,
  readOnly = false,
  summaryOnly,
}: QuizResultsProps) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [showReview, setShowReview] = useState(false)

  const total = summaryOnly ? summaryOnly.total : questions.length
  const score = summaryOnly
    ? summaryOnly.correct
    : questions.filter((q) => answers[q.id] === q.correctChoiceId).length
  // Legacy attempts only stored the final score, not which questions were
  // left blank — treat every question as answered rather than guessing.
  const answeredCount = summaryOnly
    ? summaryOnly.total
    : questions.filter((q) => answers[q.id] !== undefined).length
  const unansweredCount = total - answeredCount
  const incorrectCount = answeredCount - score
  const accuracy = Math.round((score / total) * 100)
  const passed = accuracy >= PASSING_SCORE
  const effectiveElapsedMs = summaryOnly ? summaryOnly.elapsedMs : elapsedMs
  const avgSecondsPerQuestion = effectiveElapsedMs / 1000 / total

  const sectionScores: SectionScore[] = summaryOnly
    ? summaryOnly.sectionScores
    : Object.values(
        questions.reduce<Record<string, SectionScore>>((map, q) => {
          const key = q.section ?? q.topicCategory ?? GENERAL_SECTION
          const entry = map[key] ?? { section: key, correct: 0, total: 0 }
          entry.total += 1
          if (answers[q.id] === q.correctChoiceId) entry.correct += 1
          map[key] = entry
          return map
        }, {}),
      ).sort((a, b) => b.correct / b.total - a.correct / a.total)

  // Lazy useState initializers run twice under React 18 StrictMode in dev, which would
  // double-log this attempt since recordExamAttempt is append-only. Recording happens
  // in a layout effect (guarded by a ref) instead, so it fires exactly once per mount.
  const [history, setHistory] = useState(() => getExamHistory(userId, quizSetId))
  const hasRecordedAttempt = useRef(false)

  useLayoutEffect(() => {
    if (readOnly || summaryOnly || hasRecordedAttempt.current) return
    hasRecordedAttempt.current = true
    setHistory(
      recordExamAttempt(userId, quizSetId, {
        date: new Date().toISOString(),
        correct: score,
        total,
        elapsedMs,
        sectionScores,
        answers,
        questionOrder: questions.map((q) => q.id),
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const previousAttempt = history.length >= 2 ? history[history.length - 2] : null
  const previousAccuracy = previousAttempt
    ? Math.round((previousAttempt.correct / previousAttempt.total) * 100)
    : null

  const recentHistory = history.slice(-5)
  const chartPoints: ExamHistoryPoint[] = recentHistory.map((attempt, i) => {
    const attemptNumber = history.length - recentHistory.length + i + 1
    return {
      attempt: attemptNumber,
      label: `Exam ${attemptNumber}`,
      date: formatDate(attempt.date),
      score: Math.round((attempt.correct / attempt.total) * 100),
    }
  })

  const improveCount = Math.min(2, sectionScores.length)
  const strengthCount = Math.max(sectionScores.length - improveCount, Math.min(1, sectionScores.length))
  const topStrengths = sectionScores.slice(0, strengthCount)
  const areasToImprove = sectionScores.slice(strengthCount)
  const hardestSection = [...sectionScores].sort((a, b) => a.correct / a.total - b.correct / b.total)[0]

  const weakSectionNames = areasToImprove.length > 0
    ? areasToImprove.map((s) => s.section).join(' and ')
    : 'your weaker sections'

  const recommendation = passed
    ? `You passed! If you want to improve your score further, focus on weak areas below. Otherwise, you're exam-ready!`
    : `You did not pass this time. Concentrate your next study session on ${weakSectionNames} before retaking.`

  const retakeAdvice = passed
    ? `Not necessary. Your score is above the passing threshold. Retake only if you want a higher score.`
    : `Yes — retake once you've reviewed your weak areas. You need at least ${PASSING_SCORE}% to pass.`

  let studyInsight: string
  if (!previousAttempt) {
    studyInsight = `Nice work finishing your first practice exam for this set. Keep the streak going!`
  } else {
    const prevAvg = previousAttempt.elapsedMs / 1000 / previousAttempt.total
    const speedDeltaPct =
      prevAvg > 0 ? Math.round(((prevAvg - avgSecondsPerQuestion) / prevAvg) * 100) : 0
    const scoreDelta = accuracy - (previousAccuracy ?? accuracy)
    const speedPhrase =
      speedDeltaPct > 0
        ? `You answered ${speedDeltaPct}% faster than your last attempt`
        : speedDeltaPct < 0
          ? `You answered ${Math.abs(speedDeltaPct)}% slower than your last attempt`
          : `You kept the same pace as your last attempt`
    const scorePhrase =
      scoreDelta > 0
        ? `while improving your score by ${scoreDelta}%`
        : scoreDelta < 0
          ? `while your score dipped by ${Math.abs(scoreDelta)}%`
          : `while holding your score steady`
    studyInsight = `${speedPhrase} ${scorePhrase}. Keep it up!`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#7A2323] hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to tests
          </button>
          <h1 className="font-display mt-2 text-2xl text-[#7A2323] sm:text-3xl">Exam Results &amp; Analytics</h1>
          <p className="mt-1 text-sm text-[#3A2A1A]/70">{code} — Practice Exam</p>
        </div>

        <div className="flex items-center gap-3">
          {!summaryOnly && (
            <button
              type="button"
              onClick={() => setShowReview((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-[#3A2A1A]/20 px-4 py-2.5 text-sm font-semibold text-[#3A2A1A]/80 transition-colors hover:bg-[#3A2A1A]/5"
            >
              <Eye className="size-4" />
              Review Exam
            </button>
          )}
          <button
            type="button"
            onClick={onRetake}
            className="flex items-center gap-1.5 rounded-full bg-[#7A2323] px-4 py-2.5 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90"
          >
            <RotateCcw className="size-4" />
            Retake Exam
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
            <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-6">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#3A2A1A]/70">Your Score</p>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-bold',
                    passed ? 'bg-[#E0AC48] text-[#3A2A1A]' : 'bg-[#7A2323] text-[#F3ECDC]',
                  )}
                >
                  {passed ? 'PASSED' : 'NOT PASSED'}
                </span>
              </div>
              <p className="mt-1 text-5xl font-bold text-[#7A2323]">{accuracy}%</p>
              <p className="mt-1 text-sm text-[#3A2A1A]/60">
                {score} / {total} correct
              </p>

              <div className="mt-5 flex items-center gap-4">
                <ProgressRing
                  size={104}
                  thickness={10}
                  centerColor="#FFFFFF"
                  segments={[
                    { percent: accuracy, color: '#3A5A40' },
                    { percent: 100 - accuracy, color: '#E0AC48' },
                  ]}
                >
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#3A2A1A]">{accuracy}%</p>
                    <p className="text-[10px] text-[#3A2A1A]/60">Correct</p>
                  </div>
                </ProgressRing>

                <div className="flex flex-col gap-2 text-xs text-[#3A2A1A]/70">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-[#7A2323]" />
                    Time Spent: <span className="font-semibold text-[#3A2A1A]">{formatClock(Math.round(effectiveElapsedMs / 1000))}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="size-3.5 text-[#7A2323]" />
                    Questions Answered:{' '}
                    <span className="font-semibold text-[#3A2A1A]">
                      {answeredCount} / {total}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Target className="size-3.5 text-[#7A2323]" />
                    Accuracy: <span className="font-semibold text-[#3A2A1A]">{accuracy}%</span>
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  'mt-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm',
                  passed
                    ? 'border-[#3A5A40]/30 bg-[#3A5A40]/10 text-[#3A2A1A]'
                    : 'border-[#7A2323]/30 bg-[#7A2323]/10 text-[#3A2A1A]',
                )}
              >
                {passed ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#3A5A40]" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#7A2323]" />
                )}
                <div>
                  <p className="font-semibold">
                    {passed ? 'Congratulations! You passed.' : 'Not passed yet.'}
                  </p>
                  <p className="font-reading text-[#3A2A1A]/70">
                    {passed
                      ? `You scored above the passing score of ${PASSING_SCORE}%.`
                      : `You scored below the passing score of ${PASSING_SCORE}%. Keep reviewing.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-6">
              <p className="text-lg font-bold text-[#7A2323]">Score Progression</p>
              <p className="text-xs text-[#3A2A1A]/60">Your last {chartPoints.length} exam attempts</p>
              {chartPoints.length >= 2 ? (
                <div className="mt-2">
                  <ExamHistoryChart points={chartPoints} passingScore={PASSING_SCORE} />
                </div>
              ) : (
                <p className="mt-6 text-sm text-[#3A2A1A]/60">
                  Complete another attempt of this set to see your score trend over time.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#3A2A1A]/10 bg-white p-6">
            <p className="text-lg font-bold text-[#7A2323]">Section Performance</p>
            <p className="text-xs text-[#3A2A1A]/60">Performance breakdown by exam section</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-full border-collapse text-sm sm:min-w-[36rem]">
                <thead>
                  <tr className="border-b border-[#3A2A1A]/10 text-left text-xs text-[#3A2A1A]/60">
                    <th className="pb-2 font-semibold">Section</th>
                    <th className="pb-2 font-semibold">Correct</th>
                    <th className="pb-2 font-semibold">Total</th>
                    <th className="pb-2 font-semibold">Score</th>
                    <th className="hidden pb-2 font-semibold sm:table-cell">Performance</th>
                    <th className="hidden pb-2 font-semibold sm:table-cell">Compared to Last Exam</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionScores.map((s) => {
                    const pct = Math.round((s.correct / s.total) * 100)
                    const prev = previousAttempt?.sectionScores.find(
                      (p) => p.section === s.section,
                    )
                    const prevPct = prev ? Math.round((prev.correct / prev.total) * 100) : null
                    const delta = prevPct !== null ? pct - prevPct : null

                    return (
                      <tr key={s.section} className="border-b border-[#3A2A1A]/5">
                        <td className="py-2.5 pr-3 text-[#3A2A1A]">{s.section}</td>
                        <td className="py-2.5 pr-3 text-[#3A2A1A]/80">{s.correct}</td>
                        <td className="py-2.5 pr-3 text-[#3A2A1A]/80">{s.total}</td>
                        <td className="py-2.5 pr-3 font-semibold text-[#3A2A1A]">{pct}%</td>
                        <td className="hidden py-2.5 pr-3 sm:table-cell">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-[#3A2A1A]/10">
                            <div
                              className={cn('h-full rounded-full', scoreBgClass(pct))}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="hidden py-2.5 text-xs sm:table-cell">
                          {delta === null ? (
                            <span className="text-[#3A2A1A]/40">—</span>
                          ) : delta > 0 ? (
                            <span className="flex items-center gap-1 text-[#3A5A40]">
                              <ArrowUp className="size-3.5" />
                              {delta}%
                            </span>
                          ) : delta < 0 ? (
                            <span className="flex items-center gap-1 text-[#7A2323]">
                              <ArrowDown className="size-3.5" />
                              {Math.abs(delta)}%
                            </span>
                          ) : (
                            <span className="text-[#3A2A1A]/40">No change</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-[#E0AC48]/15 font-semibold">
                    <td className="rounded-l-lg py-2.5 pr-3 pl-2 text-[#3A2A1A] sm:rounded-l-lg">Overall</td>
                    <td className="py-2.5 pr-3 text-[#3A2A1A]">{score}</td>
                    <td className="py-2.5 pr-3 text-[#3A2A1A]">{total}</td>
                    <td className="rounded-r-lg py-2.5 pr-3 text-[#3A2A1A] sm:rounded-r-none">{accuracy}%</td>
                    <td className="hidden py-2.5 pr-3 sm:table-cell">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-[#3A2A1A]/10">
                        <div
                          className={cn('h-full rounded-full', scoreBgClass(accuracy))}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                    </td>
                    <td className="hidden rounded-r-lg py-2.5 text-xs sm:table-cell">
                      {previousAccuracy === null ? (
                        <span className="text-[#3A2A1A]/40">—</span>
                      ) : accuracy > previousAccuracy ? (
                        <span className="flex items-center gap-1 text-[#3A5A40]">
                          <ArrowUp className="size-3.5" />
                          {accuracy - previousAccuracy}%
                        </span>
                      ) : accuracy < previousAccuracy ? (
                        <span className="flex items-center gap-1 text-[#7A2323]">
                          <ArrowDown className="size-3.5" />
                          {previousAccuracy - accuracy}%
                        </span>
                      ) : (
                        <span className="text-[#3A2A1A]/40">No change</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 rounded-2xl border border-[#3A2A1A]/10 bg-white p-6 sm:grid-cols-4">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-[#7A2323]" />
              <div>
                <p className="text-xs font-semibold text-[#3A2A1A]/70">Study Insights</p>
                <p className="font-reading mt-1 text-xs text-[#3A2A1A]/70">{studyInsight}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Flame className="mt-0.5 size-5 shrink-0 text-[#7A2323]" />
              <div>
                <p className="text-xs font-semibold text-[#3A2A1A]/70">Study Streak</p>
                <p className="text-lg font-bold text-[#3A2A1A]">{peekStudyStreak(userId)} days</p>
                <p className="text-xs text-[#3A2A1A]/60">Keep it up!</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <FileText className="mt-0.5 size-5 shrink-0 text-[#7A2323]" />
              <div>
                <p className="text-xs font-semibold text-[#3A2A1A]/70">Exams Taken</p>
                <p className="text-lg font-bold text-[#3A2A1A]">{history.length}</p>
                <p className="text-xs text-[#3A2A1A]/60">Total practice exams</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 size-5 shrink-0 text-[#7A2323]" />
              <div>
                <p className="text-xs font-semibold text-[#3A2A1A]/70">Last Exam</p>
                <p className="text-sm font-bold text-[#3A2A1A]">
                  {formatDate(history[history.length - 1]?.date ?? new Date().toISOString())}
                </p>
                <p className="text-xs text-[#3A2A1A]/60">{code} — Practice Exam</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-6">
            <p className="text-sm font-bold text-[#7A2323]">Result Summary</p>

            <div
              className={cn(
                'mt-3 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm',
                passed
                  ? 'border-[#3A5A40]/30 bg-[#3A5A40]/10'
                  : 'border-[#7A2323]/30 bg-[#7A2323]/10',
              )}
            >
              {passed ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#3A5A40]" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-[#7A2323]" />
              )}
              <div>
                <p className="font-semibold text-[#3A2A1A]">
                  {passed ? 'You Passed!' : 'You Did Not Pass'}
                </p>
                <p className="font-reading text-[#3A2A1A]/70">
                  {passed
                    ? 'Great job! You’ve met the passing score.'
                    : `You need ${PASSING_SCORE}% to pass. Keep practicing.`}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xs text-[#3A2A1A]/60">Passing Score</p>
                <p className="text-lg font-bold text-[#3A2A1A]">{PASSING_SCORE}%</p>
              </div>
              <div>
                <p className="text-xs text-[#3A2A1A]/60">Your Score</p>
                <p className="text-lg font-bold text-[#7A2323]">{accuracy}%</p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E0AC48]/40 bg-[#FBEED2] px-4 py-3 text-sm">
              <Star className="mt-0.5 size-4 shrink-0 text-[#B4791F]" />
              <div>
                <p className="font-semibold text-[#3A2A1A]">Recommendation</p>
                <p className="font-reading text-[#3A2A1A]/70">{recommendation}</p>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#3A2A1A]/10 bg-[#F3ECDC] px-4 py-3 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#3A5A40]" />
              <div>
                <p className="font-semibold text-[#3A2A1A]">Should you retake?</p>
                <p className="font-reading text-[#3A2A1A]/70">{retakeAdvice}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-6">
            <p className="text-sm font-bold text-[#7A2323]">Question Performance</p>

            <div className="mt-4 flex items-center gap-4">
              <ProgressRing
                size={104}
                thickness={12}
                centerColor="#FFFFFF"
                segments={[
                  { percent: (score / total) * 100, color: '#3A5A40' },
                  { percent: (incorrectCount / total) * 100, color: '#E0AC48' },
                  { percent: (unansweredCount / total) * 100, color: '#7A2323' },
                ]}
              >
                <div className="text-center">
                  <p className="text-xl font-bold text-[#3A2A1A]">{total}</p>
                  <p className="text-[10px] text-[#3A2A1A]/60">Total</p>
                </div>
              </ProgressRing>

              <div className="flex flex-col gap-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-[#3A5A40]" />
                  Correct <span className="font-semibold text-[#3A2A1A]">{score} ({accuracy}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-[#E0AC48]" />
                  Incorrect{' '}
                  <span className="font-semibold text-[#3A2A1A]">
                    {incorrectCount} ({Math.round((incorrectCount / total) * 100)}%)
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-[#7A2323]" />
                  Unanswered{' '}
                  <span className="font-semibold text-[#3A2A1A]">
                    {unansweredCount} ({Math.round((unansweredCount / total) * 100)}%)
                  </span>
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#3A2A1A]/10 pt-3 text-xs">
              <div>
                <p className="text-[#3A2A1A]/60">Average Time per Question</p>
                <p className="mt-1 flex items-center gap-1 font-semibold text-[#3A2A1A]">
                  <Clock className="size-3.5 text-[#7A2323]" />
                  {formatMinSec(avgSecondsPerQuestion)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#3A2A1A]/60">Most Difficult Section</p>
                <p className="mt-1 flex items-center justify-end gap-1 font-semibold text-[#3A2A1A]">
                  <Target className="size-3.5 text-[#7A2323]" />
                  {hardestSection?.section ?? '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-[#7A2323]">
              <Star className="size-4" />
              Top Strengths
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {topStrengths.map((s) => {
                const pct = Math.round((s.correct / s.total) * 100)
                const Icon = iconForSection(s.section)
                return (
                  <div key={s.section} className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0 text-[#3A5A40]" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#3A2A1A]">{s.section}</span>
                        <span className="font-semibold text-[#3A2A1A]">{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#3A2A1A]/10">
                        <div
                          className="h-full rounded-full bg-[#3A5A40]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-[#7A2323]">
              <Flame className="size-4" />
              Areas to Improve
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {areasToImprove.map((s) => {
                const pct = Math.round((s.correct / s.total) * 100)
                const Icon = iconForSection(s.section)
                return (
                  <div key={s.section} className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0 text-[#7A2323]" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#3A2A1A]">{s.section}</span>
                        <span className="font-semibold text-[#3A2A1A]">{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#3A2A1A]/10">
                        <div
                          className={cn('h-full rounded-full', scoreBgClass(pct))}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={onBack}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#7A2323] px-4 py-2.5 text-xs font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90"
            >
              View Personalized Study Plan
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReview && !summaryOnly && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden rounded-2xl border border-[#3A2A1A]/10 bg-white"
          >
            <div className="p-6">
              <p className="mb-3 text-lg font-bold text-[#7A2323]">Answer Review</p>
              <AnswerHistoryList questions={questions} answers={answers} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
