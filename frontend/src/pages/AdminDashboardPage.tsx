import { motion } from 'framer-motion'

import { AccountUsageCard } from '@/components/admin/AccountUsageCard'
import { ActiveSessionsCard } from '@/components/admin/ActiveSessionsCard'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminStatCards } from '@/components/admin/AdminStatCards'
import { FeatureUsageCard } from '@/components/admin/FeatureUsageCard'
import { RecentActivityCard } from '@/components/admin/RecentActivityCard'
import { SessionLocationsCard } from '@/components/admin/SessionLocationsCard'
import { fadeUpItem, staggerContainer } from '@/lib/motion'

export function AdminDashboardPage() {
  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <motion.main
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8"
        >
          <motion.div variants={fadeUpItem}>
            <AdminHeader />
          </motion.div>

          <motion.div variants={fadeUpItem} className="relative z-10">
            <AdminStatCards />
          </motion.div>

          <motion.div
            variants={fadeUpItem}
            className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
          >
            <ActiveSessionsCard />
            <SessionLocationsCard />
          </motion.div>

          <motion.div
            variants={fadeUpItem}
            className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]"
          >
            <AccountUsageCard />
            <FeatureUsageCard />
            <RecentActivityCard />
          </motion.div>
        </motion.main>
      </div>
    </div>
  )
}
