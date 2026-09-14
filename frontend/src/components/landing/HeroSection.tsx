import {
  ArrowRight,
  BarChart3,
  Bookmark,
  BookOpen,
  CheckCircle2,
  FileText,
  Flame,
  GraduationCap,
  Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const STATS = [
  { icon: FileText, label: 'questions', value: '10,000+' },
  { icon: BookOpen, label: 'flashcards', value: '1,500+' },
  { icon: GraduationCap, label: 'RMT subjects', value: '3' },
  { icon: CheckCircle2, label: 'Built for exam day', value: null },
]

const CHOICES = [
  { letter: 'A', text: 'IgM', active: true },
  { letter: 'B', text: 'IgG', active: false },
  { letter: 'C', text: 'IgA', active: false },
  { letter: 'D', text: 'IgE', active: false },
]

const SUBJECT_TABS = [
  { key: 'IS', icon: FileText, active: true },
  { key: 'BB', icon: Search, active: false },
  { key: 'MTAP', icon: FileText, active: false },
  { key: 'CC', icon: BarChart3, active: false },
]

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="font-display text-5xl leading-[1.05] font-black tracking-tight uppercase sm:text-6xl">
            <span className="text-[#7A2323]">Pass smarter.</span>
            <br />
            <span className="text-[#3A5A40]">Not harder.</span>
          </h1>

          <p className="font-reading mt-6 max-w-md text-lg text-[#3A2A1A]/80">
            Master the RMT board exam with high-yield reviewers, quizlet-style
            flashcards, and realistic practice questions.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-[#7A2323] px-6 py-3 text-sm font-semibold tracking-wide text-[#F3ECDC] uppercase transition-transform hover:scale-[1.02]"
            >
              Start reviewing
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-[#7A2323] uppercase underline underline-offset-4"
            >
              Explore subjects
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E0AC48]/25 text-[#B4791F]">
                  <stat.icon className="size-4" />
                </span>
                <span className="text-xs leading-tight text-[#3A2A1A]/80">
                  {stat.value && (
                    <span className="block font-semibold text-[#3A2A1A]">
                      {stat.value}
                    </span>
                  )}
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full">
          <div className="absolute -top-6 right-4 grid grid-cols-4 gap-1.5 opacity-40">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="size-1 rounded-full bg-[#3A2A1A]" />
            ))}
          </div>

          <div className="max-w-sm rounded-2xl border border-[#3A2A1A]/10 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#3A2A1A]">
                  Multiple Choice
                </span>
                <span className="rounded-md bg-[#E0AC48] px-2 py-0.5 text-xs font-bold text-[#3A2A1A]">
                  IS
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#3A2A1A]/60">
                <span>Question 12 of 33</span>
                <Bookmark className="size-4" />
              </div>
            </div>

            <p className="font-reading mt-4 text-sm leading-relaxed font-medium text-[#3A2A1A]">
              Which immunoglobulin class is produced first during a primary
              immune response?
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {CHOICES.map((choice) => (
                <div
                  key={choice.letter}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                    choice.active
                      ? 'border-[#E0AC48] bg-[#F7E7C4] text-[#3A2A1A]'
                      : 'border-[#3A2A1A]/10 text-[#3A2A1A]/80'
                  }`}
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      choice.active
                        ? 'bg-[#E0AC48] text-[#3A2A1A]'
                        : 'border border-[#3A2A1A]/20 text-[#3A2A1A]/60'
                    }`}
                  >
                    {choice.letter}
                  </span>
                  {choice.text}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                className="rounded-full border border-[#3A2A1A]/20 px-4 py-2 text-xs font-semibold text-[#3A2A1A]"
              >
                ← Previous
              </button>
              <button
                type="button"
                className="rounded-full bg-[#7A2323] px-4 py-2 text-xs font-semibold text-[#F3ECDC]"
              >
                Next →
              </button>
            </div>

            <div className="mt-5 border-t border-[#3A2A1A]/10 pt-4">
              <p className="mb-2 text-xs font-semibold text-[#3A2A1A]">
                RMT Subjects
              </p>
              <div className="flex gap-2">
                {SUBJECT_TABS.map((tab) => (
                  <span
                    key={tab.key}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                      tab.active
                        ? 'bg-[#7A2323] text-[#F3ECDC]'
                        : 'border border-[#3A2A1A]/15 text-[#3A2A1A]/70'
                    }`}
                  >
                    <tab.icon className="size-3.5" />
                    {tab.key}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute right-0 -bottom-10 hidden w-56 rounded-2xl border border-[#3A2A1A]/10 bg-white p-4 shadow-xl xl:block">
            <p className="text-xs font-semibold text-[#3A2A1A]/70">
              Overall Progress
            </p>
            <p className="mt-1 text-2xl font-bold text-[#3A2A1A]">68%</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#3A2A1A]/10">
              <div className="h-full w-[68%] rounded-full bg-[#7A2323]" />
            </div>
            <p className="mt-1 text-[11px] text-[#3A2A1A]/60">
              102 of 150 topics
            </p>

            <div className="mt-4 flex items-center gap-2 border-t border-[#3A2A1A]/10 pt-3">
              <Flame className="size-4 text-[#7A2323]" />
              <div>
                <p className="text-[11px] text-[#3A2A1A]/60">Study Streak</p>
                <p className="text-sm font-semibold text-[#3A2A1A]">12 days</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-[#3A2A1A]/10 pt-3">
              <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#E0AC48_0%_84%,_#3A2A1A1A_84%_100%)]">
                <div className="flex size-8 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#3A2A1A]">
                  84%
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#3A2A1A]/60">Recent Score</p>
                <p className="text-xs font-semibold text-[#3A2A1A]">
                  82 / 98 correct
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
