import { Lock, Sparkle } from 'lucide-react'

import grungeWallTexture from '@/assets/images/grunge-wall-texture.jpg'
import mountainHeader from '@/assets/images/mountain_header.png'
import { SourceStackIcon, STRATEGY_CARDS } from '@/components/quiz/StrategyOptions'

// Single source of truth for this strategy's copy — shared with the plain
// generic card so the content never has to be kept in sync by hand.
const { title, description, whyText } = STRATEGY_CARDS.find((c) => c.key === 'tagging')!

// Cross-Center Tagging isn't implemented yet (see COMING_SOON_KEYS), so this
// card is never actually selectable — it only ever renders in its muted,
// grayscale "coming soon" state, unlike the green selected-fill treatment
// used by DualQuizModesCard / VariantsDisplayCard.
export function CrossCenterTaggingCard() {
  return (
    <div
      aria-disabled="true"
      className="relative flex cursor-not-allowed items-center gap-5 overflow-hidden rounded-2xl bg-[#2B3A22] p-5 text-[#F3ECDC] opacity-60 grayscale sm:p-6"
    >
      {/* Grunge wall texture (cracks, mottling) screened over the green fill for a worn, vintage feel — matches WizardAside's maroon panel. */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${grungeWallTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.25,
        }}
      />

      <img
        src={mountainHeader}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-3/5 object-contain object-right-bottom opacity-25 sm:w-1/2"
      />

      <div className="hidden shrink-0 sm:block">
        <SourceStackIcon />
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3ECDC]/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#F3ECDC]/80 uppercase">
            <Lock className="size-2.5" />
            Coming Soon
          </span>
        </div>
        <h3 className="font-serif text-lg font-bold uppercase">{title}</h3>
        <p className="font-reading mt-1.5 text-sm text-[#F3ECDC]/80">{description}</p>

        <div className="mt-4 flex items-start gap-2 rounded-full bg-[#F3ECDC]/15 px-4 py-2.5">
          <Sparkle className="mt-0.5 size-3.5 shrink-0 text-[#E0AC48]" />
          <p className="font-reading text-xs text-[#F3ECDC]/85">{whyText}</p>
        </div>
      </div>
    </div>
  )
}
