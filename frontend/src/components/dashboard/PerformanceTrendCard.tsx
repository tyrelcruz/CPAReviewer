import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  type DotProps,
} from 'recharts'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { ChartContainer } from '@/components/ui/chart'
import type { PerformancePoint } from '@/data/dashboard-data'

interface PerformanceTrendCardProps {
  data: PerformancePoint[]
}

function renderDot(props: DotProps & { index?: number }, isLast: boolean) {
  const { cx, cy } = props
  if (cx === undefined || cy === undefined) return <g key={`dot-${props.index}`} />
  return (
    <circle
      key={`dot-${props.index}`}
      cx={cx}
      cy={cy}
      r={isLast ? 5 : 4}
      fill="#3A5A40"
      stroke="#FBF3EA"
      strokeWidth={isLast ? 2 : 0}
    />
  )
}

export function PerformanceTrendCard({ data }: PerformanceTrendCardProps) {
  const last = data[data.length - 1]

  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#3A2A1A]">Performance Trend</p>
        <Link
          to="#"
          className="flex items-center gap-1 text-sm font-medium text-[#7A2323] hover:underline"
        >
          View Analytics
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="relative mt-4 h-56">
        <ChartContainer config={{}} className="h-full w-full">
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="#3A2A1A" strokeOpacity={0.08} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#3A2A1A99', fontSize: 12 }}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#3A2A1A99', fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3A5A40"
              strokeWidth={2.5}
              dot={(props: unknown) => {
                const p = props as DotProps & { index?: number }
                return renderDot(p, p.index === data.length - 1)
              }}
              activeDot={false}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </LineChart>
        </ChartContainer>

        {last && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.9, ease: 'easeOut' }}
            className="pointer-events-none absolute top-2 right-6 rounded-lg border border-[#3A2A1A]/10 bg-white px-3 py-1.5 text-center shadow-md"
          >
            <p className="text-sm font-bold text-[#3A2A1A]">{last.score}%</p>
            <p className="text-[10px] text-[#3A2A1A]/55">{last.date}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
