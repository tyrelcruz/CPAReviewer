import { Award, ClipboardList, Flame, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { listItem, listStagger } from '@/lib/motion'

interface StatsPanelProps {
  examsTaken: number
  averageScore: number | null
  bestScore: number | null
  studyStreak: number
}

export function StatsPanel({ examsTaken, averageScore, bestScore, studyStreak }: StatsPanelProps) {
  const stats = [
    { icon: ClipboardList, label: 'Exams Taken', value: String(examsTaken), tint: '#E0AC48' },
    {
      icon: TrendingUp,
      label: 'Average Score',
      value: averageScore === null ? '—' : `${averageScore}%`,
      tint: '#3A5A40',
    },
    {
      icon: Award,
      label: 'Best Score',
      value: bestScore === null ? '—' : `${bestScore}%`,
      tint: '#3A5A40',
    },
    { icon: Flame, label: 'Study Streak', value: `${studyStreak} days`, tint: '#7A2323' },
  ]

  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#7A2323]">Your Stats</p>
        <TrendingUp className="size-4 text-[#3A5A40]" />
      </div>

      <motion.div
        variants={listStagger}
        initial="hidden"
        animate="show"
        className="mt-4 grid grid-cols-2 gap-3"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={listItem} className="rounded-xl bg-[#FBF3EA] p-3">
            <p className="text-xs text-[#3A2A1A]/60">{stat.label}</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xl font-bold text-[#3A2A1A]">{stat.value}</p>
              <span
                className="flex size-7 items-center justify-center rounded-full"
                style={{ background: `${stat.tint}26` }}
              >
                <stat.icon className="size-3.5" style={{ color: stat.tint }} />
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <Link
        to="#"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-[#3A2A1A]/15 py-2.5 text-xs font-semibold text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5"
      >
        View Performance
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
