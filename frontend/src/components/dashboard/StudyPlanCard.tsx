import { Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { listItem, listStagger } from '@/lib/motion'
import type { StudyPlanTask } from '@/data/dashboard-data'

interface StudyPlanCardProps {
  tasks: StudyPlanTask[]
}

export function StudyPlanCard({ tasks }: StudyPlanCardProps) {
  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#3A2A1A]">Today's Study Plan</p>
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-medium text-[#3A2A1A]/70 hover:text-[#3A2A1A]"
        >
          Edit Plan
          <Pencil className="size-3.5" />
        </button>
      </div>

      <motion.ul
        variants={listStagger}
        initial="hidden"
        animate="show"
        className="mt-4 flex flex-col gap-3"
      >
        {tasks.map((task) => (
          <motion.li
            key={task.title}
            variants={listItem}
            whileHover={{ x: 3 }}
            className="flex items-center gap-3 rounded-xl bg-[#FBF3EA] p-3"
          >
            <span className="size-4 shrink-0 rounded-full border-2 border-[#3A2A1A]/25" />
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#7A2323]">
              <task.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#3A2A1A]">{task.title}</p>
              <p className="font-reading mt-0.5 text-xs text-[#3A2A1A]/55">{task.subtitle}</p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#3A2A1A]/60">
              {task.progress}%
            </span>
          </motion.li>
        ))}
      </motion.ul>

      <Link
        to="#"
        className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#7A2323] hover:underline"
      >
        View full study planner
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
