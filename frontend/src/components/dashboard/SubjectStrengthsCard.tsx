import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { listItem, listStagger } from '@/lib/motion'
import { STRENGTH_LEVEL_STYLES, type SubjectStrength } from '@/data/dashboard-data'

interface SubjectStrengthsCardProps {
  subjects: SubjectStrength[]
}

export function SubjectStrengthsCard({ subjects }: SubjectStrengthsCardProps) {
  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#3A2A1A]">Subject Strengths</p>
        <Link
          to="#"
          className="flex items-center gap-1 text-sm font-medium text-[#7A2323] hover:underline"
        >
          View Details
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <motion.ul
        variants={listStagger}
        initial="hidden"
        animate="show"
        className="mt-4 flex flex-col gap-3"
      >
        {subjects.map((subject) => (
          <motion.li key={subject.code} variants={listItem} className="flex items-center gap-3">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${subject.color}40`, color: subject.color }}
            >
              <BookOpen className="size-4" />
            </span>
            <span className="flex-1 text-sm font-medium text-[#3A2A1A]">{subject.code}</span>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                STRENGTH_LEVEL_STYLES[subject.level],
              )}
            >
              {subject.level}
            </span>
            <span className="w-9 shrink-0 text-right text-sm font-semibold text-[#3A2A1A]">
              {subject.percent}%
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}
