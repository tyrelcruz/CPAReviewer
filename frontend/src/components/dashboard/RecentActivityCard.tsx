import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { listItem, listStagger } from '@/lib/motion'
import type { ActivityItem } from '@/data/dashboard-data'

interface RecentActivityCardProps {
  items: ActivityItem[]
}

export function RecentActivityCard({ items }: RecentActivityCardProps) {
  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#3A2A1A]">Recent Activity</p>
        <Link
          to="#"
          className="flex items-center gap-1 text-sm font-medium text-[#7A2323] hover:underline"
        >
          View All
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <motion.ul
        variants={listStagger}
        initial="hidden"
        animate="show"
        className="mt-4 flex flex-col gap-4"
      >
        {items.map((item) => (
          <motion.li key={item.id} variants={listItem} className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E0AC48]/20 text-[#B4791F]">
              <item.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#3A2A1A]">{item.title}</p>
              <p className="font-reading mt-0.5 text-xs text-[#3A2A1A]/55">
                {item.description}
              </p>
            </div>
            <div className="shrink-0 text-right text-xs text-[#3A2A1A]/45">
              <p>{item.date}</p>
              <p>{item.time}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      <Link
        to="#"
        className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#7A2323] hover:underline"
      >
        View all activity
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
