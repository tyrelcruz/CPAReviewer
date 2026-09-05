import { BookOpen, ClipboardList, Headphones, HelpCircle, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import notFoundIllustration from '@/assets/images/404_asset.png'

const HELP_LINKS = [
  { icon: BookOpen, label: 'Browse Subjects', description: 'Explore all review topics', to: '/app/practice' },
  { icon: ClipboardList, label: 'Mock Exams', description: 'Take a full-length exam', to: '/app' },
  { icon: HelpCircle, label: 'Question Bank', description: 'Practice by topic', to: '#' },
  { icon: Headphones, label: 'Contact Support', description: "We're here to help", to: '#' },
]

function Cloud({ className }: { className: string }) {
  return (
    <div
      className={`absolute rounded-full bg-[#DCC9A3]/50 blur-2xl ${className}`}
      aria-hidden="true"
    />
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-[#F3ECDC] text-[#3A2A1A]">
      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center gap-3 text-[#3A5A40] lg:justify-start">
              <span className="h-px flex-1 bg-[#7A2323]/30" />
              <span className="text-lg" aria-hidden="true">
                〜◡〜
              </span>
              <span className="h-px flex-1 bg-[#7A2323]/30" />
            </div>

            <p className="font-display mt-6 text-[6rem] leading-none text-[#5C1A1A] sm:text-[8.5rem] lg:text-[10rem]">
              404
            </p>
            <h1 className="font-display mt-2 text-3xl sm:text-4xl lg:text-5xl">
              <span className="text-[#7A2323]">Page </span>
              <span className="text-[#3A5A40]">Not Found</span>
            </h1>

            <div className="mt-4 flex items-center justify-center gap-3 text-[#7A2323]/40 lg:justify-start">
              <span className="h-px w-16 bg-[#7A2323]/30" />
              <span aria-hidden="true">✦</span>
              <span className="h-px w-16 bg-[#7A2323]/30" />
            </div>

            <p className="font-reading mx-auto mt-6 max-w-md text-base text-[#3A2A1A]/75 sm:text-lg lg:mx-0">
              Looks like you&rsquo;ve wandered off the study path. The page you&rsquo;re looking
              for doesn&rsquo;t exist or may have been moved.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="flex items-center gap-2 rounded-full bg-[#5C1A1A] px-6 py-3 text-sm font-bold text-[#E0AC48] transition-colors hover:bg-[#5C1A1A]/90"
              >
                <Home className="size-4" />
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/practice')}
                className="flex items-center gap-2 rounded-full border border-[#3A2A1A]/20 bg-white px-6 py-3 text-sm font-bold text-[#3A2A1A] transition-colors hover:bg-[#3A2A1A]/5"
              >
                <BookOpen className="size-4" />
                Browse Subjects
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center py-6">
            <Cloud className="top-2 left-4 size-32 sm:size-40" />
            <Cloud className="right-6 bottom-4 size-40 sm:size-52" />
            <Cloud className="top-1/3 right-0 size-24 sm:size-28" />
            <img
              src={notFoundIllustration}
              alt=""
              className="relative w-full max-w-xs drop-shadow-xl sm:max-w-sm lg:max-w-md"
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white/60 p-6">
            <p className="flex items-center justify-center gap-2 font-bold text-[#3A2A1A] lg:justify-start">
              Need help getting back?
              <span className="text-sm text-[#3A5A40]/70" aria-hidden="true">
                〜◡〜
              </span>
            </p>
            <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {HELP_LINKS.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => navigate(link.to)}
                  className="flex items-start gap-2.5 text-left"
                >
                  <link.icon className="mt-0.5 size-5 shrink-0 text-[#7A2323]" />
                  <span>
                    <span className="block text-sm font-semibold text-[#3A2A1A]">
                      {link.label}
                    </span>
                    <span className="text-xs text-[#3A2A1A]/60">{link.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#5C1A1A] px-6 py-4 text-[#F3ECDC]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2 font-bold text-[#E0AC48]">
            <span aria-hidden="true">〜◡〜</span>
            Pass smarter. Not harder.
          </span>
          <span className="text-[#F3ECDC]/70">
            © {new Date().getFullYear()} KABIS CPA Reviewer. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  )
}
