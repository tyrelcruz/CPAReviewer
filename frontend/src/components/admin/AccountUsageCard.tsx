import { ArrowUp, ClipboardCheck, Clock, FileText, History, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { getAdminAnalytics, type AdminAnalytics, type AdminStatWithDelta } from '@/api/admin'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatDuration } from '@/lib/time'

// Aggregate stats, not a per-second live view — refreshing this often keeps
// the "Last 7 days" figures reasonably current without polling as
// aggressively as the Active Sessions card.
const POLL_INTERVAL_MS = 60_000

const chartConfig = {
  activeUsers: {
    label: 'Active Users',
    color: '#7A2323',
  },
} satisfies ChartConfig

function formatDayLabel(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function DeltaLine({ deltaPercent }: { deltaPercent: number | null }) {
  if (deltaPercent === null) {
    return <p className="mt-0.5 text-[10px] font-semibold text-[#3A2A1A]/40">New this week</p>
  }
  const isUp = deltaPercent >= 0
  return (
    <p
      className={
        isUp
          ? 'mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold text-[#3A5A40]'
          : 'mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold text-[#7A2323]'
      }
    >
      <ArrowUp className={isUp ? 'size-2.5' : 'size-2.5 rotate-180'} />
      {Math.abs(deltaPercent)}%
    </p>
  )
}

export function AccountUsageCard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    function load() {
      getAdminAnalytics()
        .then((data) => {
          if (cancelled) return
          setAnalytics(data)
          setError(null)
        })
        .catch(() => {
          if (cancelled) return
          setError('Unable to load usage analytics. Is the backend running?')
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
    }

    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const stats: { icon: typeof Users; label: string; value: string; delta: AdminStatWithDelta | null }[] = analytics
    ? [
        {
          icon: Users,
          label: 'Active Users',
          value: analytics.usageStats.activeUsers.value.toLocaleString(),
          delta: analytics.usageStats.activeUsers,
        },
        {
          icon: FileText,
          label: 'Exams Taken',
          value: analytics.usageStats.examsTaken.value.toLocaleString(),
          delta: analytics.usageStats.examsTaken,
        },
        {
          icon: ClipboardCheck,
          label: 'Questions Answered',
          value: analytics.usageStats.questionsAnswered.value.toLocaleString(),
          delta: analytics.usageStats.questionsAnswered,
        },
        {
          icon: Clock,
          label: 'Avg. Exam Duration',
          value:
            analytics.usageStats.avgExamDurationSeconds === null
              ? '—'
              : formatDuration(analytics.usageStats.avgExamDurationSeconds),
          delta: null,
        },
      ]
    : []

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E0AC48]/15 text-[#B4791F]">
            <History className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-[#3A2A1A]">Account Usage</p>
            <p className="font-reading text-xs text-[#3A2A1A]/60">
              How your users are utilizing the platform — last 7 days.
            </p>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-[#7A2323]">{error}</p>}

      {!error && isLoading && (
        <p className="mt-4 text-sm text-[#3A2A1A]/60">Loading usage analytics…</p>
      )}

      {!error && !isLoading && analytics && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-start gap-2">
                <stat.icon className="mt-0.5 size-4 shrink-0 text-[#7A2323]" />
                <div className="min-w-0">
                  <p className="text-lg font-bold text-[#3A2A1A]">{stat.value}</p>
                  <p className="truncate text-xs text-[#3A2A1A]/60">{stat.label}</p>
                  {stat.delta && <DeltaLine deltaPercent={stat.delta.deltaPercent} />}
                </div>
              </div>
            ))}
          </div>

          <ChartContainer config={chartConfig} className="mt-5 aspect-auto h-56 w-full">
            <AreaChart
              data={analytics.usageSeries.map((d) => ({ ...d, label: formatDayLabel(d.date) }))}
              margin={{ left: 4, right: 12, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="admin-usage-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7A2323" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7A2323" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#3A2A1A1A" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                width={32}
                allowDecimals={false}
                tickFormatter={(value: number) => (value >= 1000 ? `${Math.round(value / 1000)}K` : String(value))}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="activeUsers"
                type="monotone"
                stroke="#7A2323"
                strokeWidth={2}
                fill="url(#admin-usage-fill)"
                dot={{ r: 3, fill: '#7A2323' }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ChartContainer>
        </>
      )}
    </div>
  )
}
