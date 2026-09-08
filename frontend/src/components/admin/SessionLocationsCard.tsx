import { LocateFixed, Minus, Plus, Star } from 'lucide-react'

import { TOP_LOCATIONS, TOTAL_ACTIVE_SESSIONS } from '@/data/admin-dashboard-data'

const RANK_COLORS = ['#7A2323', '#E0AC48', '#3A2A1A99', '#3A2A1A99', '#3A2A1A99']

export function SessionLocationsCard() {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E0AC48]/15 text-[#B4791F]">
            <LocateFixed className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-[#3A2A1A]">Session Locations</p>
            <p className="font-reading text-xs text-[#3A2A1A]/60">
              Live map of where users are currently accessing the platform.
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#3A5A40]/10 px-3 py-1 text-xs font-semibold text-[#3A5A40]">
          <span className="size-1.5 rounded-full bg-[#3A5A40]" />
          {TOTAL_ACTIVE_SESSIONS} online
        </span>
      </div>

      <div className="relative mt-4 lg:flex-1">
        <div className="relative h-64 overflow-hidden rounded-xl border border-[#3A2A1A]/10 bg-[#F3ECDC] sm:h-72 lg:h-80">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          >
            <path
              d="M32 4 C40 2 46 8 44 15 C50 18 52 26 46 30 C52 34 54 42 48 46 C56 48 58 56 52 60 C58 64 60 72 54 78 C58 84 56 92 48 94 C42 96 36 90 38 84 C30 82 26 74 30 68 C24 64 22 56 28 52 C22 48 20 40 26 36 C20 32 20 24 28 20 C24 14 26 6 32 4 Z"
              fill="#7A2323"
              fillOpacity="0.08"
              stroke="#7A2323"
              strokeOpacity="0.2"
              strokeWidth="0.6"
            />
          </svg>

          {TOP_LOCATIONS.slice(0, 3).map((loc) => (
            <div
              key={loc.city}
              className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
              style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
            >
              <div className="mb-1 rounded-lg border border-[#3A2A1A]/10 bg-white px-2.5 py-1 text-center shadow-sm">
                <p className="text-xs font-semibold whitespace-nowrap text-[#3A2A1A]">{loc.city}</p>
                <p className="text-[10px] whitespace-nowrap text-[#3A2A1A]/60">{loc.users} users</p>
              </div>
              <span className="flex size-4 items-center justify-center rounded-full border-2 border-white bg-[#7A2323] shadow">
                <span className="size-1.5 rounded-full bg-white" />
              </span>
            </div>
          ))}

          <div className="absolute right-3 bottom-3 flex flex-col overflow-hidden rounded-lg border border-[#3A2A1A]/10 bg-white shadow-sm">
            <button
              type="button"
              aria-label="Zoom in"
              className="flex size-8 items-center justify-center text-[#3A2A1A]/70 hover:bg-[#3A2A1A]/5"
            >
              <Plus className="size-4" />
            </button>
            <div className="h-px bg-[#3A2A1A]/10" />
            <button
              type="button"
              aria-label="Zoom out"
              className="flex size-8 items-center justify-center text-[#3A2A1A]/70 hover:bg-[#3A2A1A]/5"
            >
              <Minus className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-[#3A2A1A]/10 bg-white p-3 lg:absolute lg:top-3 lg:right-3 lg:mt-0 lg:w-56 lg:shadow-md">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#7A2323]">
            <Star className="size-3.5" />
            Top Locations
          </p>
          <ul className="flex flex-col gap-2">
            {TOP_LOCATIONS.map((loc, i) => (
              <li key={loc.city} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 text-[#3A2A1A]">
                  <span
                    className="flex size-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: RANK_COLORS[i] }}
                  >
                    {loc.rank}
                  </span>
                  {loc.city}
                </span>
                <span className="font-semibold text-[#3A2A1A]">{loc.users}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
