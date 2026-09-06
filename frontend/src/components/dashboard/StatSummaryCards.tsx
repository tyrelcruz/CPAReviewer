import { FileText, Flame, Target, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

import { fadeUpItem, staggerContainer } from '@/lib/motion'

interface StatCardProps {
  label: string
  icon: LucideIcon
  tint: string
  children: ReactNode
}

function StatCard({ label, icon: Icon, tint, children }: StatCardProps) {
  return (
    <motion.div
      variants={fadeUpItem}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-[#3A2A1A]/50 uppercase">
          {label}
        </p>
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: `${tint}26` }}
        >
          <Icon className="size-5" style={{ color: tint }} />
        </span>
      </div>
      {children}
    </motion.div>
  )
}

interface StatSummaryCardsProps {
  overallProgress: number
  questionsAnswered: number
  totalQuestions: number
  averageScore: number
  scoreDelta: number
  streak: number
}

export function StatSummaryCards({
  overallProgress,
  questionsAnswered,
  totalQuestions,
  averageScore,
  scoreDelta,
  streak,
}: StatSummaryCardsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard label="Overall Progress" icon={Target} tint="#3A5A40">
        <p className="mt-2 text-3xl font-bold text-[#3A2A1A]">{overallProgress}%</p>
        <p className="font-reading mt-1 text-sm text-[#3A2A1A]/55">Keep it up!</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#3A2A1A]/10">
          <motion.div
            className="h-full rounded-full bg-[#3A5A40]"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
      </StatCard>

      <StatCard label="Questions Answered" icon={FileText} tint="#B4791F">
        <p className="mt-2 text-3xl font-bold text-[#3A2A1A]">
          {questionsAnswered.toLocaleString()}
        </p>
        <p className="font-reading mt-1 text-sm text-[#3A2A1A]/55">
          of {totalQuestions.toLocaleString()} questions
        </p>
      </StatCard>

      <StatCard label="Average Score" icon={TrendingUp} tint="#3A5A40">
        <p className="mt-2 text-3xl font-bold text-[#3A2A1A]">{averageScore}%</p>
        <p className="font-reading mt-1 text-sm text-[#3A5A40]">
          +{scoreDelta}% vs last 7 days
        </p>
      </StatCard>

      <StatCard label="Streak" icon={Flame} tint="#7A2323">
        <p className="mt-2 text-3xl font-bold text-[#3A2A1A]">{streak}</p>
        <p className="font-reading mt-1 text-sm text-[#3A2A1A]/55">days in a row</p>
      </StatCard>
    </motion.div>
  )
}
