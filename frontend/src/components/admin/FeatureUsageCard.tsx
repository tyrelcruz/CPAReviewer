import { BarChart3 } from 'lucide-react'

import { FEATURE_USAGE } from '@/data/admin-dashboard-data'

export function FeatureUsageCard() {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E0AC48]/15 text-[#B4791F]">
          <BarChart3 className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-[#3A2A1A]">Feature Usage</p>
          <p className="font-reading text-xs text-[#3A2A1A]/60">Which features are being used most.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {FEATURE_USAGE.map((feature) => (
          <div key={feature.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-[#3A2A1A]">{feature.label}</span>
              <span className="font-semibold text-[#3A2A1A]">{feature.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#3A2A1A]/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${feature.percent}%`, background: feature.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
