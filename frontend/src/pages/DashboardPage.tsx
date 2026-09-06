import { motion } from 'framer-motion'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatSummaryCards } from '@/components/dashboard/StatSummaryCards'
import { StudyProgressCard } from '@/components/dashboard/StudyProgressCard'
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard'
import { StudyPlanCard } from '@/components/dashboard/StudyPlanCard'
import { PerformanceTrendCard } from '@/components/dashboard/PerformanceTrendCard'
import { SubjectStrengthsCard } from '@/components/dashboard/SubjectStrengthsCard'
import { ConsistencyBanner } from '@/components/dashboard/ConsistencyBanner'
import { useAuth } from '@/context/AuthContext'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import {
  OVERALL_PROGRESS,
  PERFORMANCE_TREND,
  RECENT_ACTIVITY,
  SUBJECT_PROGRESS,
  SUBJECT_STRENGTHS,
  TODAYS_STUDY_PLAN,
} from '@/data/dashboard-data'

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] ?? 'Juan'

  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <motion.main
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-[1400px] flex-col gap-6 px-8 py-8"
        >
          <motion.div variants={fadeUpItem}>
            <DashboardHeader firstName={firstName} />
          </motion.div>

          <motion.div variants={fadeUpItem}>
            <StatSummaryCards
              overallProgress={OVERALL_PROGRESS}
              questionsAnswered={2480}
              totalQuestions={3600}
              averageScore={76}
              scoreDelta={8}
              streak={12}
            />
          </motion.div>

          <motion.div variants={fadeUpItem} className="grid gap-6 lg:grid-cols-2">
            <StudyProgressCard overall={OVERALL_PROGRESS} subjects={SUBJECT_PROGRESS} />
            <RecentActivityCard items={RECENT_ACTIVITY} />
          </motion.div>

          <motion.div variants={fadeUpItem} className="grid gap-6 lg:grid-cols-3">
            <StudyPlanCard tasks={TODAYS_STUDY_PLAN} />
            <PerformanceTrendCard data={PERFORMANCE_TREND} />
            <SubjectStrengthsCard subjects={SUBJECT_STRENGTHS} />
          </motion.div>

          <motion.div variants={fadeUpItem}>
            <ConsistencyBanner />
          </motion.div>
        </motion.main>
      </div>
    </div>
  )
}
