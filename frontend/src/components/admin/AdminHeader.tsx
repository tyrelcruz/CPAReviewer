import { Bell, ChevronDown, ShieldUser } from 'lucide-react'

import carabaoRepia from '@/assets/images/carabao_repia.png'

export function AdminHeader() {
  return (
    <div className="relative">
      <img
        src={carabaoRepia}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1 right-[8%] h-40 w-auto -translate-y-1/2 object-contain opacity-20 sm:h-56 lg:h-72"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-3xl font-bold text-[#7A2323] sm:text-4xl">Admin Dashboard</h1>
          <p className="font-reading mt-1.5 max-w-md text-sm text-[#3A2A1A]/70">
            Monitor platform usage, manage accounts, and keep track of active sessions in real-time.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-11 items-center justify-center rounded-full bg-white text-[#3A2A1A] shadow-sm hover:bg-[#3A2A1A]/5"
          >
            <Bell className="size-5" />
            <span className="absolute top-2.5 right-3 size-2 rounded-full bg-[#7A2323]" />
          </button>

          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-3 pl-1.5 shadow-sm hover:bg-[#3A2A1A]/5"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-[#7A2323] text-[#F3ECDC]">
              <ShieldUser className="size-4.5" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold text-[#3A2A1A]">Admin</span>
              <span className="block text-xs text-[#3A2A1A]/55">System Administrator</span>
            </span>
            <ChevronDown className="size-4 text-[#3A2A1A]/50" />
          </button>
        </div>
      </div>
    </div>
  )
}
