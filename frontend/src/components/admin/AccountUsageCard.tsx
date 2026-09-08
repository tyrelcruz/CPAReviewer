import { ArrowUp, ChevronDown, History } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { ACCOUNT_USAGE_SERIES, ACCOUNT_USAGE_STATS } from '@/data/admin-dashboard-data'

const chartConfig = {
  value: {
    label: 'Active Users',
    color: '#7A2323',
  },
} satisfies ChartConfig

export function AccountUsageCard() {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E0AC48]/15 text-[#B4791F]">
            <History className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-[#3A2A1A]">Account Usage</p>
            <p className="font-reading text-xs text-[#3A2A1A]/60">How your users are utilizing the platform.</p>
          </div>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#3A2A1A]/15 px-3 py-1.5 text-xs font-semibold text-[#3A2A1A]/70 hover:bg-[#3A2A1A]/5"
        >
          Last 7 days
          <ChevronDown className="size-3.5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ACCOUNT_USAGE_STATS.map((stat) => (
          <div key={stat.label} className="flex items-start gap-2">
            <stat.icon className="mt-0.5 size-4 shrink-0 text-[#7A2323]" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-[#3A2A1A]">{stat.value}</p>
              <p className="truncate text-xs text-[#3A2A1A]/60">{stat.label}</p>
              <p className="mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold text-[#3A5A40]">
                <ArrowUp className="size-2.5" />
                {stat.deltaPercent}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <ChartContainer config={chartConfig} className="mt-5 aspect-auto h-56 w-full">
        <AreaChart data={ACCOUNT_USAGE_SERIES} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
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
            width={40}
            tickFormatter={(value) => `${Math.round(value / 1000)}K`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            dataKey="value"
            type="monotone"
            stroke="#7A2323"
            strokeWidth={2}
            fill="url(#admin-usage-fill)"
            dot={{ r: 3, fill: '#7A2323' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
