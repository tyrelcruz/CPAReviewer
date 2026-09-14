import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import heroQuizLoopVideo from '@/assets/videos/hero-quiz-loop.mp4'

const STATS = [
  { icon: FileText, label: 'questions', value: '10,000+' },
  { icon: BookOpen, label: 'flashcards', value: '1,500+' },
  { icon: GraduationCap, label: 'RMT subjects', value: '3' },
  { icon: CheckCircle2, label: 'Built for exam day', value: null },
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
          <video
            src={heroQuizLoopVideo}
            autoPlay
            muted
            loop
            playsInline
            className="pointer-events-none aspect-[1320/740] w-full object-contain"
          />
        </div>
      </div>
    </section>
  )
}
