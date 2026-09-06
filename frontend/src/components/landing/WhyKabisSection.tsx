import {
  BarChart3,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame,
  ShieldCheck,
  Sparkle,
  Target,
} from 'lucide-react'
import { motion } from 'framer-motion'

import iphoneMock from '@/assets/images/iphone_mock.png'

const FEATURES = [
  { icon: BookOpen, label: 'Complete modules and reviewers' },
  { icon: Target, label: 'Smart practice and flashcards' },
  { icon: BarChart3, label: 'Track progress in real time' },
  { icon: ShieldCheck, label: 'Built for CPA success' },
]

const CHOICES = [
  { letter: 'A', text: 'Notes payable due in 8 months', active: true },
  { letter: 'B', text: 'Bonds payable due in 5 years', active: false },
  { letter: 'C', text: 'Common stock', active: false },
  { letter: 'D', text: 'Land', active: false },
]

const DECKS = [
  { name: 'FAR - Conceptual', count: 142, active: false },
  { name: 'Audit Procedures', count: 118, active: false },
  { name: 'REG - Individual Tax', count: 156, active: true },
  { name: 'Business Law', count: 97, active: false },
]

// Measured from the PNG: the frame's transparent screen hole as a % of the
// (square) canvas, so the overlay lines up with the glass regardless of
// how large the mockup is rendered.
const SCREEN = { left: 31, top: 8.6, width: 38, height: 82.8 }

function Sparkles() {
  return (
    <>
      <Sparkle className="absolute -top-2 left-10 size-5 rotate-12 text-[#E0AC48]/70" />
      <Sparkle className="absolute top-24 -left-4 size-3.5 -rotate-12 text-[#E0AC48]/50" />
      <Sparkle className="absolute right-6 -bottom-3 size-4 rotate-45 text-[#E0AC48]/60" />
      <div className="absolute top-4 right-0 grid grid-cols-4 gap-1.5 opacity-30">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="size-1 rounded-full bg-[#F3ECDC]" />
        ))}
      </div>
      <div className="absolute right-2 bottom-16 flex -rotate-12 flex-wrap gap-1 opacity-40">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="h-4 w-0.5 rounded-full bg-[#E0AC48]" />
        ))}
      </div>
    </>
  )
}

function PhoneScreen() {
  return (
    <div className="flex h-full w-full flex-col bg-white px-3.5 pt-6 pb-4 text-[#3A2A1A]">
      <p className="text-[11px] leading-tight font-bold">
        Good morning, Juan! <span aria-hidden="true">👋</span>
      </p>
      <p className="mt-0.5 text-[8px] leading-tight text-[#3A2A1A]/60">
        Keep going! Your future self is counting on you.
      </p>

      <div className="mt-3 rounded-lg border border-[#3A2A1A]/10 p-2.5">
        <p className="text-[7px] font-semibold tracking-wide text-[#3A2A1A]/50 uppercase">
          Overall Progress
        </p>
        <p className="mt-0.5 text-base font-bold">68%</p>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#3A2A1A]/10">
          <div className="h-full w-[68%] rounded-full bg-[#7A2323]" />
        </div>
        <p className="mt-1 text-[7px] text-[#3A2A1A]/55">102 of 150 topics</p>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-[#3A2A1A]/10 p-2">
          <Flame className="size-3 shrink-0 text-[#7A2323]" />
          <span className="text-[7px] leading-tight">
            <span className="block text-[#3A2A1A]/55">Study</span>
            <span className="font-semibold">12 days</span>
          </span>
        </div>
        <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-[#3A2A1A]/10 p-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#E0AC48_0%_84%,#3A2A1A1A_84%_100%)]">
            <div className="flex size-4 items-center justify-center rounded-full bg-white text-[5px] font-bold">
              84%
            </div>
          </div>
          <span className="text-[7px] leading-tight">
            <span className="block text-[#3A2A1A]/55">Recent Score</span>
            <span className="font-semibold">82 / 98 correct</span>
          </span>
        </div>
      </div>

      <div className="mt-2.5 border-t border-[#3A2A1A]/10 pt-2">
        <p className="text-[7px] font-semibold text-[#3A2A1A]/50 uppercase">Next Up</p>
        <p className="mt-0.5 text-[9px] font-medium">FAR – Cash and Cash Equivalents</p>
      </div>

      <button
        type="button"
        className="mt-auto rounded-full bg-[#7A2323] py-1.5 text-[8px] font-semibold text-[#F3ECDC]"
      >
        Continue Reviewing
      </button>
    </div>
  )
}

function QuizFloatCard() {
  return (
    <div className="w-56 rounded-xl border border-[#3A2A1A]/10 bg-white p-3.5 shadow-2xl sm:w-64">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[#3A2A1A]">Multiple Choice</span>
          <span className="rounded-md bg-[#E0AC48] px-1.5 py-0.5 text-[8px] font-bold text-[#3A2A1A]">
            FAR
          </span>
        </div>
        <Bookmark className="size-3 shrink-0 text-[#3A2A1A]/50" />
      </div>
      <p className="mt-1 text-[8px] text-[#3A2A1A]/55">Question 12 of 33</p>

      <p className="font-reading mt-2 text-[10px] leading-snug font-medium text-[#3A2A1A]">
        Which of the following items would most likely be classified as a current liability?
      </p>

      <div className="mt-2 flex flex-col gap-1">
        {CHOICES.map((choice) => (
          <div
            key={choice.letter}
            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[8px] ${
              choice.active
                ? 'border-[#E0AC48] bg-[#F7E7C4] text-[#3A2A1A]'
                : 'border-[#3A2A1A]/10 text-[#3A2A1A]/75'
            }`}
          >
            <span
              className={`flex size-3.5 shrink-0 items-center justify-center rounded-full text-[7px] font-bold ${
                choice.active
                  ? 'bg-[#E0AC48] text-[#3A2A1A]'
                  : 'border border-[#3A2A1A]/20 text-[#3A2A1A]/55'
              }`}
            >
              {choice.letter}
            </span>
            {choice.text}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="rounded-full border border-[#3A2A1A]/15 px-2 py-1 text-[7px] font-semibold text-[#3A2A1A]/70">
          ← Previous
        </span>
        <span className="rounded-full bg-[#7A2323] px-2 py-1 text-[7px] font-semibold text-[#F3ECDC]">
          Next →
        </span>
      </div>
    </div>
  )
}

function FlashcardFloatCard() {
  return (
    <div className="flex w-64 overflow-hidden rounded-xl border border-[#3A2A1A]/10 bg-white shadow-2xl sm:w-72">
      <div className="w-20 shrink-0 border-r border-[#3A2A1A]/10 p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[7px] font-semibold text-[#3A2A1A]/70">Card Decks</span>
          <span className="text-[9px] text-[#3A2A1A]/40" aria-hidden="true">
            +
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {DECKS.map((deck) => (
            <div
              key={deck.name}
              className={`rounded-md px-1.5 py-1 text-[6.5px] leading-tight ${
                deck.active ? 'bg-[#E0AC48] text-[#3A2A1A]' : 'text-[#3A2A1A]/65'
              }`}
            >
              <span className="block font-medium">{deck.name}</span>
              <span className="opacity-70">{deck.count} cards</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-3">
        <div className="flex items-center justify-between">
          <span className="rounded bg-[#E0AC48] px-1.5 py-0.5 text-[7px] font-bold text-[#3A2A1A]">
            FRONT
          </span>
        </div>
        <p className="font-reading mt-3 text-[9px] leading-snug font-medium text-[#3A2A1A]">
          Under the accrual basis of accounting, when is revenue recognized?
        </p>
        <div className="mt-3 border-t border-[#3A2A1A]/10 pt-2 text-center">
          <span className="text-[7px] font-medium text-[#B8721F] underline underline-offset-2">
            Tap to reveal answer
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="rounded-full border border-[#3A2A1A]/20 px-1.5 py-1 text-[6.5px] font-semibold">
            Shuffle
          </span>
          <span className="text-[6.5px] text-[#3A2A1A]/55">29/156</span>
          <div className="flex items-center gap-1">
            <ChevronLeft className="size-2.5 text-[#3A2A1A]/50" />
            <ChevronRight className="size-2.5 text-[#3A2A1A]/50" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function WhyKabisSection() {
  return (
    <section className="overflow-hidden bg-[#2E0D0A] px-6 py-24 text-[#F3ECDC]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
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
            KABIS is designed to help you study smarter and stay consistent from your first
            review to exam day.
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
          <div className="relative mx-auto w-72 sm:w-96 lg:w-120">
            <Sparkles />

            <div className="relative aspect-square w-full">
              <img
                src={iphoneMock}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              />
              <div
                className="absolute overflow-hidden rounded-3xl"
                style={{
                  left: `${SCREEN.left}%`,
                  top: `${SCREEN.top}%`,
                  width: `${SCREEN.width}%`,
                  height: `${SCREEN.height}%`,
                }}
              >
                <PhoneScreen />
              </div>
            </div>

            <div className="absolute -top-6 -right-20 hidden sm:block lg:-right-28">
              <QuizFloatCard />
            </div>

            <div className="absolute -right-14 -bottom-12 hidden sm:block lg:-right-24">
              <FlashcardFloatCard />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
