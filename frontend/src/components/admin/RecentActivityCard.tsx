import { Clock } from 'lucide-react'

import { ADMIN_RECENT_ACTIVITY } from '@/data/admin-dashboard-data'

export function RecentActivityCard() {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E0AC48]/15 text-[#B4791F]">
          <Clock className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-[#3A2A1A]">Recent Activity</p>
          <p className="font-reading text-xs text-[#3A2A1A]/60">Latest platform events and user actions.</p>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-4">
        {ADMIN_RECENT_ACTIVITY.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: entry.iconBg, color: entry.iconColor }}
            >
              <entry.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#3A2A1A]">{entry.title}</p>
              <p className="truncate text-xs text-[#3A2A1A]/60">{entry.subtitle}</p>
            </div>
            <span className="shrink-0 text-xs text-[#3A2A1A]/50">{entry.time}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
