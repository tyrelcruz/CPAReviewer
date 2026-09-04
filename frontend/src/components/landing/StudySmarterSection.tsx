import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Plus,
  Scale,
  Shuffle,
  Star,
  Target,
  Volume2,
} from 'lucide-react'

const FEATURES = [
  { icon: FileText, label: 'Active recall flashcards' },
  { icon: Target, label: 'High-yield practice' },
  { icon: BarChart3, label: 'Performance insights' },
]

const DECKS = [
  { icon: FileText, name: 'FAR - Conceptual', count: 142, active: false },
  { icon: ClipboardList, name: 'Audit Procedures', count: 118, active: false },
  { icon: BookOpen, name: 'REG - Individual Tax', count: 156, active: true },
  { icon: Scale, name: 'Business Law', count: 97, active: false },
]

export function StudySmarterSection() {
  return (
    <section className="bg-[#5C1A1A] px-6 py-20 text-[#F3ECDC]">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest text-[#3A5A40]/80 uppercase">
            <span className="text-[#E0AC48]">〜</span>
            Study smarter
          </div>
          <h2 className="font-display text-4xl leading-tight text-[#E0AC48] sm:text-5xl">
            Turn review time into exam-ready confidence
          </h2>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            {FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#E0AC48]/15 text-[#E0AC48]">
                  <feature.icon className="size-4" />
                </span>
                <span className="text-sm font-medium text-[#F3ECDC]/90">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3 text-[#3A5A40]">
            <span className="text-lg">〜◡〜◡〜</span>
            <span className="h-px flex-1 bg-[#F3ECDC]/15" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[13rem_1fr]">
          <div className="rounded-2xl border border-[#F3ECDC]/10 bg-[#4A1414] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#F3ECDC]/80">
                Card Decks
              </p>
              <Plus className="size-4 text-[#F3ECDC]/60" />
            </div>
            <div className="flex flex-col gap-1.5">
              {DECKS.map((deck) => (
                <div
                  key={deck.name}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${
                    deck.active
                      ? 'bg-[#E0AC48] text-[#3A2A1A]'
                      : 'text-[#F3ECDC]/75 hover:bg-[#F3ECDC]/5'
                  }`}
                >
                  <deck.icon className="size-3.5 shrink-0" />
                  <span>
                    <span className="block font-medium">{deck.name}</span>
                    <span className="opacity-70">{deck.count} cards</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#F3ECDC]/10 bg-[#4A1414] p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-[#E0AC48] px-2 py-0.5 text-xs font-bold text-[#3A2A1A]">
                FRONT
              </span>
              <div className="flex items-center gap-3 text-[#F3ECDC]/60">
                <Volume2 className="size-4" />
                <Star className="size-4" />
              </div>
            </div>

            <p className="font-reading mt-6 text-lg leading-snug font-medium">
              Under the accrual basis of accounting, when is revenue
              recognized?
            </p>

            <div className="mt-8 border-t border-[#F3ECDC]/10 pt-4 text-center">
              <span className="text-sm font-medium text-[#E0AC48] underline underline-offset-4">
                Tap to reveal answer
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full border border-[#F3ECDC]/20 px-3 py-1.5 text-xs font-semibold"
              >
                <Shuffle className="size-3.5" />
                Shuffle
              </button>
              <div className="flex flex-1 items-center gap-2 px-4">
                <span className="text-xs text-[#F3ECDC]/60">23/156</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#F3ECDC]/15">
                  <div className="h-full w-[15%] rounded-full bg-[#E0AC48]" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-full border border-[#F3ECDC]/20"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-full border border-[#F3ECDC]/20"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
