import { ArrowRight, Layers, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import grungeWallTexture from '@/assets/images/grunge-wall-texture.jpg'
import mountainLandscape from '@/assets/images/mountain_landscape.png'
import kabisEmblem from '@/assets/logo/kabis_emblem.png'
import { getComingSoonKeys, STRATEGY_CARDS } from '@/components/quiz/StrategyOptions'
import { useAuth } from '@/context/AuthContext'

interface WizardAsideProps {
  subjectCode: string
  subjectFullName: string
  ctaLabel: string
  ctaIcon?: LucideIcon
  onCta: () => void
}

export function WizardAside({
  subjectCode,
  subjectFullName,
  ctaLabel,
  ctaIcon: CtaIcon = ArrowRight,
  onCta,
}: WizardAsideProps) {
  const { user } = useAuth()
  const comingSoonCount = getComingSoonKeys(user?.course).length

  return (
    <aside className="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-[#530b08] p-6 text-[#F3ECDC] shadow-[inset_0_0_12px_3px_rgba(0,0,0,0.55),inset_0_0_80px_20px_rgba(0,0,0,0.4)] lg:sticky lg:top-8">
      {/* Grunge wall texture (cracks, mottling) screened over the maroon for a worn, vintage feel. */}
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
        src={kabisEmblem}
        alt=""
        aria-hidden="true"
        className="mx-auto h-28 w-28 shrink-0 object-contain"
      />

      <div>
        <p className="font-serif text-2xl font-bold text-white">{subjectCode}</p>
        <p className="font-reading mt-1 text-xs font-semibold tracking-wide text-[#E0AC48] uppercase">
          {subjectFullName}
        </p>
      </div>

      <div className="h-px bg-[#E0AC48]/40" />

      <div className="flex items-start gap-3">
        <Layers className="size-5 shrink-0 text-[#E0AC48]" />
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#E0AC48] uppercase">
            Strategy Component
          </p>
          <p className="font-reading mt-0.5 text-sm text-[#F3ECDC]">
            {STRATEGY_CARDS.length - comingSoonCount} of {STRATEGY_CARDS.length}{' '}
            Available Now
          </p>
        </div>
      </div>

      <div className="h-px bg-[#E0AC48]/40" />

      <div className="flex items-start gap-3">
        <Target className="size-5 shrink-0 text-[#E0AC48]" />
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#E0AC48] uppercase">
            Your Goal
          </p>
          <p className="font-reading mt-0.5 text-sm text-[#F3ECDC]">
            Build smarter. Pass stronger.
          </p>
        </div>
      </div>

      <div className="relative -mx-6 mt-2 h-36 w-[calc(100%+3rem)] shrink-0 sm:h-44">
        <img
          src={mountainLandscape}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom opacity-90"
        />
      </div>

      <button
        type="button"
        onClick={onCta}
        className="relative z-10 flex items-center justify-center gap-2 rounded-full bg-[#E0AC48] px-6 py-3.5 text-sm font-bold tracking-wide text-[#3A2A1A] uppercase transition-transform hover:scale-[1.02]"
      >
        {ctaLabel}
        <CtaIcon className="size-4" />
      </button>
    </aside>
  )
}
