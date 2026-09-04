import { ArrowLeft } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { Quiz } from '@/components/quiz/Quiz'
import { TestSelector } from '@/components/quiz/TestSelector'
import { quizSets } from '@/data/quiz-data'
import type { QuizSet } from '@/types/quiz'

export function QuizApp() {
  const [selectedSet, setSelectedSet] = useState<QuizSet | null>(null)

  return (
    <div className="animated-gradient flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="font-display text-4xl font-bold tracking-tight text-white drop-shadow-sm"
      >
        KABIS CPA Reviewer
      </motion.h1>

      <AnimatePresence mode="wait">
        {selectedSet ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex w-full max-w-lg flex-col gap-3"
          >
            <button
              type="button"
              onClick={() => setSelectedSet(null)}
              className="flex items-center gap-1 self-start text-sm text-white/80 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to tests
            </button>
            <Quiz key={selectedSet.id} questions={selectedSet.questions} />
          </motion.div>
        ) : (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-lg"
          >
            <TestSelector quizSets={quizSets} onSelect={setSelectedSet} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
