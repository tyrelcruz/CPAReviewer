import { Mountain } from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'
import { useMemo } from 'react'

import { ChartContainer } from '@/components/ui/chart'
import type { ReviewPlanEntry } from '@/lib/reviewPlanner'

interface ProgressPanelProps {
  entries: ReviewPlanEntry[]
}

function fractionPercent(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0
}

export function ProgressPanel({ entries }: ProgressPanelProps) {
  const stats = useMemo(() => {
    const total = entries.length
    const done = entries.filter((e) => e.done).length

    const studyEntries = entries.filter((e) => e.type === 'Review' || e.type === 'Quiz')
    const studyDone = studyEntries.filter((e) => e.done).length

    const examEntries = entries.filter((e) => e.type === 'Exam')
    const examDone = examEntries.filter((e) => e.done).length

    return {
      overall: fractionPercent(done, total),
      studyDone,
      studyTotal: studyEntries.length,
      examDone,
      examTotal: examEntries.length,
    }
  }, [entries])

  const donutData = [
    { name: 'complete', value: stats.overall },
    { name: 'remaining', value: 100 - stats.overall },
  ]

  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#7A2323]/10 text-[#7A2323]">
          <Mountain className="size-4" />
        </span>
        <p className="font-semibold text-[#3A2A1A]">Your Progress</p>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4">
        <div className="relative flex size-36 shrink-0 items-center justify-center">
          <ChartContainer config={{}} className="aspect-square size-36">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                innerRadius={48}
                outerRadius={64}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                <Cell fill="#7A2323" />
                <Cell fill="#3A2A1A0D" />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute flex flex-col items-center">
            <span className="text-2xl font-bold text-[#3A2A1A]">{stats.overall}%</span>
          </div>
        </div>
        <p className="text-xs font-semibold text-[#3A2A1A]/50">Overall Completion</p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-[#3A2A1A]">
              {stats.studyDone} / {stats.studyTotal}
            </span>
          </div>
          <p className="text-xs text-[#3A2A1A]/55">Topics Completed</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#3A2A1A]/10">
            <div
              className="h-full rounded-full bg-[#3A5A40]"
              style={{ width: `${fractionPercent(stats.studyDone, stats.studyTotal)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-[#3A2A1A]">
              {stats.examDone} / {stats.examTotal}
            </span>
          </div>
          <p className="text-xs text-[#3A2A1A]/55">Exam Taken</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#3A2A1A]/10">
            <div
              className="h-full rounded-full bg-[#E0AC48]"
              style={{ width: `${fractionPercent(stats.examDone, stats.examTotal)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
