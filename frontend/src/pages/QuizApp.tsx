import { motion } from 'framer-motion'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { MobileTabBar } from '@/components/dashboard/MobileTabBar'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Quiz } from '@/components/quiz/Quiz'
import { QuizResults } from '@/components/quiz/QuizResults'
import { quizSets } from '@/data/quiz-data'
import { getExamHistory } from '@/lib/examHistory'
import type { QuizQuestion } from '@/types/quiz'

interface QuizSetupState {
  itemCount?: number
  timeLimitSeconds?: number
  /** Set when navigating in from "Review Results" — shows the last completed
   * attempt's results screen (with its own Retake option) instead of
   * launching a brand-new attempt. */
  mode?: 'review'
}

export function QuizApp() {
  const { quizSetId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const setupState = location.state as QuizSetupState | null
  const selectedSet = quizSetId
    ? quizSets.find((set) => set.id === quizSetId)
    : quizSets[0]
  const questions =
    selectedSet && setupState?.itemCount
      ? selectedSet.questions.slice(0, setupState.itemCount)
      : selectedSet?.questions

  // "Retake Exam" on the replayed results screen drops back to a live attempt.
  const [retaking, setRetaking] = useState(false)

  const lastAttempt = selectedSet ? getExamHistory(selectedSet.id).at(-1) : undefined
  const canReplayLastAttempt = Boolean(
    lastAttempt?.answers && lastAttempt?.questionOrder && lastAttempt.questionOrder.length > 0,
  )
  // "Review Results" should always land on the results screen for a taken
  // exam, even for attempts recorded before per-question replay data existed
  // — those fall back to a summary-only results view instead of relaunching
  // a live exam.
  const showResults = setupState?.mode === 'review' && !retaking && Boolean(selectedSet) && Boolean(lastAttempt)

  let replayQuestions: QuizQuestion[] = []
  if (showResults && canReplayLastAttempt && selectedSet && lastAttempt?.questionOrder) {
    const byId = new Map(selectedSet.questions.map((q) => [q.id, q]))
    replayQuestions = lastAttempt.questionOrder
      .map((id) => byId.get(id))
      .filter((q): q is QuizQuestion => q !== undefined)
  }

  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <Sidebar showMobileMenu={false} />
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-[1600px] px-6 py-10">
          {selectedSet ? (
            <motion.div
              key={selectedSet.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {showResults && lastAttempt ? (
                <QuizResults
                  quizSetId={selectedSet.id}
                  code={selectedSet.code}
                  questions={canReplayLastAttempt ? replayQuestions : []}
                  answers={canReplayLastAttempt ? lastAttempt.answers! : {}}
                  elapsedMs={lastAttempt.elapsedMs}
                  onRetake={() => setRetaking(true)}
                  onBack={() => navigate('/app')}
                  readOnly
                  summaryOnly={
                    canReplayLastAttempt
                      ? undefined
                      : {
                          correct: lastAttempt.correct,
                          total: lastAttempt.total,
                          elapsedMs: lastAttempt.elapsedMs,
                          sectionScores: lastAttempt.sectionScores,
                        }
                  }
                />
              ) : (
                <Quiz
                  quizSetId={selectedSet.id}
                  questions={questions ?? selectedSet.questions}
                  code={selectedSet.code}
                  onBack={() => navigate('/app')}
                  timeLimitSeconds={setupState?.timeLimitSeconds}
                  progressKey={selectedSet.id}
                />
              )}
            </motion.div>
          ) : (
            <div className="mx-auto max-w-lg py-16 text-center">
              <p className="font-display text-2xl text-[#7A2323]">Exam not found</p>
              <p className="font-reading mt-2 text-sm text-[#3A2A1A]/70">
                We couldn&rsquo;t find that practice exam. It may have been moved or renamed.
              </p>
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="mt-6 rounded-full bg-[#7A2323] px-6 py-3 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90"
              >
                Back to Mock Exams
              </button>
            </div>
          )}
        </div>
      </div>

      <MobileTabBar />
    </div>
  )
}
