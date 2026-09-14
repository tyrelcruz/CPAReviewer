import { BarChart3, BookOpen, ShieldCheck, Target } from 'lucide-react'
import { motion } from 'framer-motion'

import whyKabisHeroVideo from '@/assets/videos/why-kabis-hero.mp4'

const FEATURES = [
  { icon: BookOpen, label: 'Complete modules and reviewers' },
  { icon: Target, label: 'Smart practice and flashcards' },
  { icon: BarChart3, label: 'Track progress in real time' },
  { icon: ShieldCheck, label: 'Built for RMT success' },
]

export function WhyKabisSection() {
  return (
    <section className="overflow-hidden bg-[#2E0D0A] px-6 py-24 text-[#F3ECDC]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest text-[#E0AC48] uppercase">
            <span aria-hidden="true">〜</span>
            How KABIS works
          </div>

          <h2 className="font-serif text-4xl leading-tight font-bold sm:text-5xl">
            <span className="text-white">Everything you need.</span>
            <br />
            <span className="text-[#E0AC48]">All in one place.</span>
          </h2>

          <p className="font-reading mt-5 max-w-md text-[#F3ECDC]/70">
            KABIS brings your reviewers, flashcards, and practice exams together in one place —
            built to help every aspiring RMT study smarter, build consistency, and gain complete
            confidence leading up to exam day.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.label} className="flex flex-col items-start gap-2.5">
                <span className="flex size-11 items-center justify-center rounded-xl border border-[#E0AC48]/30 bg-[#F3ECDC]/5 text-[#E0AC48]">
                  <feature.icon className="size-5" />
                </span>
                <span className="text-sm leading-snug font-medium text-[#F3ECDC]/85">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm py-6 lg:mx-0 lg:max-w-none lg:py-0"
        >
          <div className="relative mx-auto aspect-[1200/1060] w-[22.5rem] sm:w-[30rem] lg:w-[37.5rem]">
            <video
              src={whyKabisHeroVideo}
              autoPlay
              muted
              loop
              playsInline
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
