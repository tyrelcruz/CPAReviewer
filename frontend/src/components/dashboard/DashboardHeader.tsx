import { Bell, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

interface DashboardHeaderProps {
  firstName: string
}

export function DashboardHeader({ firstName }: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#3A2A1A]">
          Good morning, {firstName}!{' '}
          <motion.span
            aria-hidden="true"
            className="inline-block origin-[70%_70%]"
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 18, -8, 18, 0] }}
            transition={{ duration: 1, delay: 0.4, ease: 'easeInOut' }}
          >
            👋
          </motion.span>
        </h1>
        <p className="font-reading mt-1 text-sm text-[#3A2A1A]/60">
          Every question you answer today brings you closer to becoming a CPA.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <motion.button
          type="button"
          aria-label="Notifications"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          className="relative flex size-11 items-center justify-center rounded-full bg-white text-[#3A2A1A] shadow-sm hover:bg-[#3A2A1A]/5"
        >
          <Bell className="size-5" />
          <span className="absolute top-2.5 right-3 size-2 rounded-full bg-[#7A2323]" />
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 rounded-full bg-white py-1.5 pr-3 pl-1.5 shadow-sm hover:bg-[#3A2A1A]/5"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-[#7A2323] text-sm font-semibold text-[#F3ECDC]">
            JC
          </span>
          <span className="text-left">
            <span className="block text-sm font-semibold text-[#3A2A1A]">Juan Cruz</span>
            <span className="block text-xs text-[#3A2A1A]/55">CPA Aspirant</span>
          </span>
          <ChevronDown className="size-4 text-[#3A2A1A]/50" />
        </motion.button>
      </div>
    </div>
  )
}
