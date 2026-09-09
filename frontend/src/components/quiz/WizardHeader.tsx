import { ArrowLeft, Check } from 'lucide-react'

import mountainsHeader from '@/assets/images/carabao_repia.png'
import { cn } from '@/lib/utils'

const WIZARD_STEPS = ['Choose Strategy', 'Set Quiz Details']

interface WizardHeaderProps {
  subjectCode: string
  subjectFullName: string
  /** 0-indexed — which of WIZARD_STEPS is currently active. */
  activeStepIndex: number
  onBack: () => void
}

export function WizardHeader({
  subjectCode,
  subjectFullName,
  activeStepIndex,
  onBack,
}: WizardHeaderProps) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#3A2A1A]/70 transition-colors hover:text-[#7A2323]"
      >
        <ArrowLeft className="size-4" />
        Back to Subjects
      </button>

      <div className="relative mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div>
          <p className="font-display text-2xl text-[#7A2323]">{subjectCode}</p>
          <p className="font-reading mt-0.5 text-xs font-semibold tracking-wide text-[#3A2A1A]/60 uppercase">
            {subjectFullName}
          </p>
        </div>

        <ol className="flex flex-wrap items-center gap-2">
          {WIZARD_STEPS.map((step, i) => {
            const isActive = i === activeStepIndex
            const isDone = i < activeStepIndex
            return (
              <li
                key={step}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-[#530b08] text-white'
                    : isDone
                      ? 'bg-[#3A5A40]/10 text-[#3A5A40]'
                      : 'bg-[#3A2A1A]/5 text-[#3A2A1A]/40',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    isActive
                      ? 'bg-white text-[#530b08]'
                      : isDone
                        ? 'bg-[#3A5A40] text-white'
                        : 'border border-[#3A2A1A]/20 text-[#3A2A1A]/40',
                  )}
                >
                  {isDone ? <Check className="size-3" /> : i + 1}
                </span>
                {step}
              </li>
            )
          })}
        </ol>

        {/* Absolutely positioned so its (large) height doesn't stretch this row's
            layout height — it just overlays to the right without pushing content. */}
        <img
          src={mountainsHeader}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-1 right-0 hidden h-24 w-auto -translate-y-1/2 object-contain opacity-20 sm:block md:h-32 lg:h-40 xl:h-48"
        />
      </div>
    </>
  )
}
