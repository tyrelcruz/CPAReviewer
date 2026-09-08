import { ClipboardCheck, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { listMyExamSessions, listSubjectCounts, type ExamSessionSummary } from '@/api/exams'
import { ConsistencyBanner } from '@/components/dashboard/ConsistencyBanner'
import { ContinueStudyingBanner } from '@/components/dashboard/ContinueStudyingBanner'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { MobileTabBar } from '@/components/dashboard/MobileTabBar'
import { PerformanceTrendCard } from '@/components/dashboard/PerformanceTrendCard'
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { StatSummaryCards } from '@/components/dashboard/StatSummaryCards'
import { StudyPlanCard } from '@/components/dashboard/StudyPlanCard'
import { StudyProgressCard } from '@/components/dashboard/StudyProgressCard'
import { SubjectStrengthsCard } from '@/components/dashboard/SubjectStrengthsCard'
import { useAuth } from '@/context/AuthContext'
import {
  aggregateBySubject,
  buildCombinedAttempts,
  overallAveragePercent,
  scoreDeltaVsPrevious,
  toPerformanceTrend,
  toRecentActivity,
  toStudyPlan,
  toSubjectProgress,
  toSubjectStrengths,
} from '@/lib/dashboardStats'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { peekStudyStreak } from '@/lib/streak'
import { quizSets } from '@/data/quiz-data'

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] ?? 'Juan'

  const [bankSessions, setBankSessions] = useState<ExamSessionSummary[]>([])
  const [bankSubjectCounts, setBankSubjectCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    listMyExamSessions()
      .then((sessions) => {
        if (!cancelled) setBankSessions(sessions)
      })
      .catch(() => {
        // No real sessions to show is a valid state — the localStorage-backed
        // legacy attempts below still render on their own.
      })
    listSubjectCounts()
      .then((counts) => {
        if (!cancelled) setBankSubjectCounts(counts)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const attempts = useMemo(
    () => buildCombinedAttempts(quizSets, bankSessions),
    [bankSessions],
  )
  const aggregates = useMemo(() => aggregateBySubject(attempts), [attempts])
  const overallProgress = useMemo(() => overallAveragePercent(attempts), [attempts])
  const scoreDelta = useMemo(() => scoreDeltaVsPrevious(attempts), [attempts])
  const streak = peekStudyStreak()

  const questionsAnswered = attempts.reduce((sum, a) => sum + a.total, 0)
  const totalQuestions =
    quizSets.reduce((sum, set) => sum + set.questions.length, 0) +
    Object.values(bankSubjectCounts).reduce((sum, n) => sum + n, 0)

  const recentActivity = toRecentActivity(attempts).map((item) => ({ ...item, icon: FileText }))
  const studyPlan = toStudyPlan(aggregates).map((task) => ({ ...task, icon: ClipboardCheck }))

  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <Sidebar showMobileMenu={false} />

      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <motion.main
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8"
        >
          <motion.div variants={fadeUpItem}>
            <DashboardHeader firstName={firstName} />
          </motion.div>

          <ContinueStudyingBanner />

          <motion.div variants={fadeUpItem}>
            <StatSummaryCards
              overallProgress={overallProgress}
              questionsAnswered={questionsAnswered}
              totalQuestions={totalQuestions}
              averageScore={overallProgress}
              scoreDelta={scoreDelta}
              streak={streak}
            />
          </motion.div>

          <motion.div variants={fadeUpItem} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StudyProgressCard
              overall={overallProgress ?? 0}
              subjects={toSubjectProgress(aggregates)}
            />
            <RecentActivityCard items={recentActivity} />
          </motion.div>

          <motion.div variants={fadeUpItem} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <StudyPlanCard tasks={studyPlan} />
            <PerformanceTrendCard data={toPerformanceTrend(attempts)} />
            <SubjectStrengthsCard subjects={toSubjectStrengths(aggregates)} />
          </motion.div>

          <motion.div variants={fadeUpItem}>
            <ConsistencyBanner />
          </motion.div>
        </motion.main>
      </div>

      <MobileTabBar />
    </div>
  )
}
