import { Bell, CalendarDays, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

import multipleMountains from '@/assets/images/multiple_mountains.png'
import studyCarabao from '@/assets/images/study_carabao.png'
import { fadeUpItem, staggerContainer } from '@/lib/motion'

interface ReviewPlannerHeroProps {
  initials: string
  name: string
  roleLabel: string
}

export function ReviewPlannerHero({ initials, name, roleLabel }: ReviewPlannerHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#FBF3EA]">
      <img
        src={multipleMountains}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-[-30px] left-0 h-24 w-auto object-contain opacity-40 sm:h-32"
      />
      <img
        src={studyCarabao}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-0 h-24 w-auto object-contain sm:top-16 sm:h-44 lg:top-20 lg:h-56 xl:h-64"
      />

      <div className="relative flex flex-col gap-6 px-5 pt-5 pb-6 sm:px-8 sm:pt-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex size-11 items-center justify-center rounded-full bg-white text-[#3A2A1A] shadow-sm hover:bg-[#3A2A1A]/5"
            >
              <Bell className="size-5" />
              <span className="absolute top-2.5 right-3 size-2 rounded-full bg-[#7A2323]" />
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-3 pl-1.5 shadow-sm hover:bg-[#3A2A1A]/5"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#7A2323] text-sm font-semibold text-[#F3ECDC]">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold text-[#3A2A1A]">{name}</span>
                <span className="block text-xs text-[#3A2A1A]/55">{roleLabel}</span>
              </span>
              <ChevronDown className="size-4 text-[#3A2A1A]/50" />
            </button>
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <motion.div variants={fadeUpItem} className="max-w-xl self-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#7A2323]/40 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-[#7A2323] uppercase">
              <CalendarDays className="size-3.5" />
              Review Planner
            </span>
            <h1 className="font-display mt-4 text-3xl leading-tight text-[#7A2323] uppercase sm:text-4xl">
              Plan today,
              <br />
              pass tomorrow.
            </h1>
            <p className="font-reading mt-3 text-sm text-[#3A2A1A]/65 sm:text-base">
              Organize your reviews, track your exams, and stay consistent with your study goals.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUpItem}
            className="relative mx-auto max-w-xs shrink-0 rounded-2xl border border-[#3A2A1A]/15 bg-[#FBF3EA] p-6 lg:mx-0 lg:-translate-x-20 xl:-translate-x-78"
          >
            <span className="font-display block text-4xl leading-none text-[#E0AC48]" aria-hidden="true">
              &ldquo;
            </span>
            <p className="font-reading mt-2 text-lg leading-snug text-[#3A2A1A]/80">
              &ldquo;Discipline today builds the freedom you want tomorrow.&rdquo;
            </p>
            <span
              className="mt-3 block text-2xl text-[#E0AC48] italic"
              style={{ transform: 'rotate(-4deg)' }}
              aria-hidden="true"
            >
              ⁓a
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
