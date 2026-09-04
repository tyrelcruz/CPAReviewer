import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { QuizSet } from '@/types/quiz'

interface TestSelectorProps {
  quizSets: QuizSet[]
  onSelect: (quizSet: QuizSet) => void
}

export function TestSelector({ quizSets, onSelect }: TestSelectorProps) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      {quizSets.map((quizSet, i) => (
        <motion.div
          key={quizSet.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Card
            role="button"
            tabIndex={0}
            onClick={() => onSelect(quizSet)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(quizSet)
            }}
            className="w-full cursor-pointer py-4 transition-colors hover:bg-accent"
          >
            <CardHeader>
              <CardTitle className="font-display">{quizSet.title}</CardTitle>
              <CardDescription>{quizSet.description}</CardDescription>
              <CardAction className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {quizSet.questions.length} questions
                </span>
                <ChevronRight className="text-muted-foreground size-4" />
              </CardAction>
            </CardHeader>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
