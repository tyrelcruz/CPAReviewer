import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

export interface ExamHistoryPoint {
  attempt: number
  label: string
  date: string
  score: number
}

interface ExamHistoryChartProps {
  points: ExamHistoryPoint[]
  passingScore?: number
}

const chartConfig = {
  score: {
    label: 'Score',
    color: '#3A5A40',
  },
} satisfies ChartConfig

export function ExamHistoryChart({ points, passingScore = 75 }: ExamHistoryChartProps) {
  if (points.length < 2) {
    return null
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
      <LineChart data={points} margin={{ left: 4, right: 12, top: 16, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#3A2A1A1A" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          tickFormatter={(value) => `${value}%`}
          width={44}
        />
        <ReferenceLine
          y={passingScore}
          stroke="#7A2323"
          strokeDasharray="3 3"
          strokeOpacity={0.6}
          label={{
            value: `Passing Score (${passingScore}%)`,
            position: 'insideBottomRight',
            fill: '#7A2323',
            fontSize: 10,
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => String(payload[0]?.payload?.date ?? '')}
              formatter={(value) => (
                <div className="flex w-full items-center gap-1.5">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[#3A5A40]" />
                  <span className="text-[#3A2A1A]/70">Score</span>
                  <span className="ml-auto font-mono font-medium tabular-nums text-[#3A2A1A]">
                    {String(value)}%
                  </span>
                </div>
              )}
            />
          }
        />
        <Line
          dataKey="score"
          type="monotone"
          stroke="#3A5A40"
          strokeWidth={2}
          dot={{ r: 4, fill: '#3A5A40' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
