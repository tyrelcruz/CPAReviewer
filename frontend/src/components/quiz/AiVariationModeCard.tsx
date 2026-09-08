import { Lightbulb } from 'lucide-react'

import grungeWallTexture from '@/assets/images/grunge-wall-texture.jpg'
import mountainHeader from '@/assets/images/mountain_header.png'
import { SourceStackIcon, STRATEGY_CARDS } from '@/components/quiz/StrategyOptions'

interface AiVariationModeCardProps {
  selected: boolean
  onSelect: () => void
}

// Single source of truth for this strategy's copy — shared with the plain
// generic card so the content never has to be kept in sync by hand.
const { title, description, whyText } = STRATEGY_CARDS.find((c) => c.key === 'tagging')!

// Only ever rendered while it's the selected strategy — its distinctive dark
// green fill IS the selected indicator, so there's no separate ring/border
// to toggle here. When another strategy is selected, ChooseStrategyPage
// swaps this out for the plain generic card treatment instead.
export function AiVariationModeCard({ selected, onSelect }: AiVariationModeCardProps) {
  return (
    <label className="relative flex cursor-pointer items-center gap-5 overflow-hidden rounded-2xl bg-[#2B3A22] p-5 text-[#F3ECDC] sm:p-6">
      <input
        type="radio"
        name="strategy"
        value="tagging"
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />

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
        <h3 className="font-serif text-lg font-bold uppercase">{title}</h3>
        <p className="font-reading mt-1.5 text-sm text-[#F3ECDC]/80">{description}</p>

        <div className="mt-4 flex items-start gap-2 rounded-full bg-[#F3ECDC]/15 px-4 py-2.5">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[#E0AC48]" />
          <p className="font-reading text-xs text-[#F3ECDC]/85">{whyText}</p>
        </div>
      </div>
    </label>
  )
}
