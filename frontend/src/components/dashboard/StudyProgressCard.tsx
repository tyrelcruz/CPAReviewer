import { Cell, Pie, PieChart } from 'recharts'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { ChartContainer } from '@/components/ui/chart'
import { listItem, listStagger } from '@/lib/motion'
import type { SubjectProgress } from '@/data/dashboard-data'

interface StudyProgressCardProps {
  overall: number
  subjects: SubjectProgress[]
}

export function StudyProgressCard({ overall, subjects }: StudyProgressCardProps) {
  const donutData = [
    { name: 'complete', value: overall },
    { name: 'remaining', value: 100 - overall },
  ]

  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#3A2A1A]">Study Progress</p>
        <Link
          to="#"
          className="flex items-center gap-1 text-sm font-medium text-[#7A2323] hover:underline"
        >
          View Details
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative flex size-40 shrink-0 items-center justify-center">
          <ChartContainer config={{}} className="aspect-square size-40">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                innerRadius={54}
                outerRadius={72}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                <Cell fill="#3A5A40" />
                <Cell fill="#3A2A1A0D" />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute flex flex-col items-center">
            <span className="text-3xl font-bold text-[#3A2A1A]">{overall}%</span>
            <span className="text-xs text-[#3A2A1A]/55">Overall</span>
          </div>
        </div>

        <motion.div
          variants={listStagger}
          initial="hidden"
          animate="show"
          className="flex w-full flex-col gap-2.5"
        >
          {subjects.map((subject) => (
            <motion.div key={subject.code} variants={listItem} className="flex items-center gap-3">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: subject.color }}
              />
              <span className="w-16 shrink-0 text-sm font-medium text-[#3A2A1A]">
                {subject.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#3A2A1A]/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: subject.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${subject.percent}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-sm font-semibold text-[#3A2A1A]">
                {subject.percent}%
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
