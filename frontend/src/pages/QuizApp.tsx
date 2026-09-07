import { motion } from 'framer-motion'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopNavbar } from '@/components/dashboard/TopNavbar'
import { Quiz } from '@/components/quiz/Quiz'
import { quizSets } from '@/data/quiz-data'

interface QuizSetupState {
  itemCount?: number
  timeLimitSeconds?: number
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

  return (
    <div className="flex min-h-svh flex-col bg-[#F3ECDC] text-[#3A2A1A] lg:flex-row">
      <div className="lg:hidden">
        <TopNavbar />
      </div>
      <Sidebar showMobileMenu={false} />
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1600px] px-6 py-10">
          {selectedSet ? (
            <motion.div
              key={selectedSet.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Quiz
                quizSetId={selectedSet.id}
                questions={questions ?? selectedSet.questions}
                code={selectedSet.code}
                onBack={() => navigate('/app')}
                timeLimitSeconds={setupState?.timeLimitSeconds}
              />
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
    </div>
  )
}
