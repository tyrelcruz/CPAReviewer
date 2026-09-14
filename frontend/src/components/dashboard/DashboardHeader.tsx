import { Bell, ChevronDown, Sun } from 'lucide-react'
import { motion } from 'framer-motion'

import mountainsHeader from '@/assets/images/mountains_header.png'
import { Logo } from '@/components/landing/Logo'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/userDisplay'

interface DashboardHeaderProps {
  firstName: string
}

function GreetingWave() {
  return (
    <motion.span
      aria-hidden="true"
      className="inline-block origin-[70%_70%]"
      initial={{ rotate: 0 }}
      animate={{ rotate: [0, 18, -8, 18, 0] }}
      transition={{ duration: 1, delay: 0.4, ease: 'easeInOut' }}
    >
      👋
    </motion.span>
  )
}

export function DashboardHeader({ firstName }: DashboardHeaderProps) {
  const { user } = useAuth()
  const displayName = user?.name ?? 'Reviewer'
  const initials = getInitials(displayName)
  const courseLabel = 'RMT Aspirant'

  return (
    <>
      {/* Mobile/tablet: logo + bell/profile row, then a separate greeting row with a
          sun icon and the mountain backdrop. Desktop combines it all into one row below. */}
      <div className="flex flex-col gap-4 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Logo className="h-9" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex size-11 items-center justify-center rounded-full bg-white text-[#3A2A1A] shadow-sm"
            >
              <Bell className="size-5" />
              <span className="absolute top-2.5 right-3 size-2 rounded-full bg-[#7A2323]" />
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-3 pl-1.5 shadow-sm"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#7A2323] text-sm font-semibold text-[#F3ECDC]">
                {initials}
              </span>
              <span className="text-left">
                <span className="block text-sm font-semibold text-[#3A2A1A]">{displayName}</span>
                <span className="block text-xs text-[#3A2A1A]/55">{courseLabel}</span>
              </span>
              <ChevronDown className="size-4 text-[#3A2A1A]/50" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <img
            src={mountainsHeader}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-0 h-16 w-auto -translate-y-1/2 object-contain sm:h-20"
          />
          <div className="relative flex max-w-[70%] items-start gap-2.5 sm:max-w-[60%]">
            <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E0AC48]/20 text-[#B4791F]">
              <Sun className="size-4" />
            </span>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-bold text-[#3A2A1A]">
                Good morning, {firstName}! <GreetingWave />
              </h1>
              <p className="font-reading mt-1 text-sm text-[#3A2A1A]/60">
                Every question you answer today brings you closer to becoming an RMT.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden items-start justify-between gap-4 lg:flex">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#3A2A1A]">
            Good morning, {firstName}! <GreetingWave />
          </h1>
          <p className="font-reading mt-1 text-sm text-[#3A2A1A]/60">
            Every question you answer today brings you closer to becoming an RMT.
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
              {initials}
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold text-[#3A2A1A]">{displayName}</span>
              <span className="block text-xs text-[#3A2A1A]/55">{courseLabel}</span>
            </span>
            <ChevronDown className="size-4 text-[#3A2A1A]/50" />
          </motion.button>
        </div>
      </div>
    </>
  )
}
