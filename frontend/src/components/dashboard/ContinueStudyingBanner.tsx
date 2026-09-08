import { ArrowRight, PlayCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'
import { MOCK_EXAMS } from '@/data/mock-exams-data'
import { quizSets } from '@/data/quiz-data'
import { getExamProgress, getInProgressSessionPointer } from '@/lib/examProgress'
import { fadeUpItem } from '@/lib/motion'

interface InProgressInfo {
  title: string
  subtitle: string
  href: string
}

/** Checks every real source of "in progress" exam state (localStorage-backed
 * legacy quiz progress, and the last unsubmitted bank-exam session pointer)
 * and surfaces whichever one is actually paused — nothing fabricated. */
function findInProgressExam(userId: string): InProgressInfo | null {
  for (const set of quizSets) {
    const progress = getExamProgress(userId, set.id)
    if (progress) {
      return {
        title: set.title,
        subtitle: `Question ${progress.currentIndex + 1} of ${progress.questionOrder.length}`,
        href: `/app/practice/${set.id}`,
      }
    }
  }

  for (const exam of MOCK_EXAMS) {
    if (!exam.bankExam) continue
    const sessionId = getInProgressSessionPointer(
      userId,
      `${exam.bankExam.subject}-${exam.bankExam.mode}`,
    )
    if (!sessionId) continue
    const progress = getExamProgress(userId, `bank-${sessionId}`)
    if (progress) {
      return {
        title: exam.title,
        subtitle: `Question ${progress.currentIndex + 1} of ${progress.questionOrder.length}`,
        href: `/app/exam/${sessionId}`,
      }
    }
  }

  return null
}

export function ContinueStudyingBanner() {
  const { user } = useAuth()
  const inProgress = findInProgressExam(user?.id ?? '')
  if (!inProgress) return null

  return (
    <motion.div
      variants={fadeUpItem}
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#3A5A40]/30 bg-[#3A5A40]/10 px-5 py-4 sm:px-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#3A5A40]/20 text-[#3A5A40]">
          <PlayCircle className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-[#3A2A1A]">Continue where you left off</p>
          <p className="font-reading truncate text-sm text-[#3A2A1A]/70">
            {inProgress.title} · {inProgress.subtitle}
          </p>
        </div>
      </div>
      <Link
        to={inProgress.href}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#3A5A40] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3A5A40]/90"
      >
        Resume Exam
        <ArrowRight className="size-4" />
      </Link>
    </motion.div>
  )
}
