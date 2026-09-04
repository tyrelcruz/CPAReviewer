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

interface ProgressionPoint {
  index: number
  accuracy: number
}

interface ScoreProgressionChartProps {
  points: ProgressionPoint[]
}

const chartConfig = {
  accuracy: {
    label: 'Running accuracy',
    color: '#2a78d6',
  },
} satisfies ChartConfig

export function ScoreProgressionChart({ points }: ScoreProgressionChartProps) {
  if (points.length < 2) {
    return null
  }

  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">Score progression</p>
      <ChartContainer config={chartConfig} className="aspect-auto h-32 w-full">
        <LineChart data={points} margin={{ left: 4, right: 8, top: 12, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="index"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tickFormatter={(value) => `Q${value}`}
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
            y={75}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{
              value: '75% pass',
              position: 'insideTopRight',
              fill: 'var(--muted-foreground)',
              fontSize: 10,
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => `Question ${value}`}
                formatter={(value, name) => (
                  <div className="flex w-full items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: 'var(--color-accuracy)' }}
                    />
                    <span className="text-muted-foreground">{String(name)}</span>
                    <span className="text-foreground ml-auto font-mono font-medium tabular-nums">
                      {String(value)}%
                    </span>
                  </div>
                )}
              />
            }
          />
          <Line
            dataKey="accuracy"
            type="monotone"
            stroke="var(--color-accuracy)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
