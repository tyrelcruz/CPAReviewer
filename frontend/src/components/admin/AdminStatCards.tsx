import { ArrowUp } from 'lucide-react'
import { motion } from 'framer-motion'

import { ADMIN_STAT_CARDS } from '@/data/admin-dashboard-data'
import { fadeUpItem, staggerContainer } from '@/lib/motion'

export function AdminStatCards() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {ADMIN_STAT_CARDS.map((card) => (
        <motion.div
          key={card.label}
          variants={fadeUpItem}
          className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-[#E0AC48]/15 text-[#B4791F]">
            <card.icon className="size-5" />
          </span>
          <p className="font-reading mt-3 text-sm text-[#3A2A1A]/70">{card.label}</p>
          <p className="mt-0.5 text-2xl font-bold text-[#3A2A1A]">{card.value}</p>

          {card.variant === 'delta' ? (
            <p className="mt-1 flex items-center gap-1 text-xs">
              <span className="flex items-center gap-0.5 font-semibold text-[#3A5A40]">
                <ArrowUp className="size-3" />
                {card.deltaPercent}%
              </span>
              <span className="text-[#3A2A1A]/50">vs. last 7 days</span>
            </p>
          ) : (
            <div className="mt-2.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#3A2A1A]/10">
                <div
                  className="h-full rounded-full bg-[#7A2323]"
                  style={{ width: `${card.progressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[#3A2A1A]/50">{card.progressLabel}</p>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
