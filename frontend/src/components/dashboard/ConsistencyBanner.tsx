import { ShieldCheck } from 'lucide-react'

import booksAndMug from '@/assets/images/book_asset.png'

export function ConsistencyBanner() {
  return (
    <div className="relative flex items-center justify-between gap-6 overflow-hidden rounded-2xl border border-[#3A2A1A]/10 bg-[#F3ECDC] px-8 py-6">
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#3A5A40]/15 text-[#3A5A40]">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-[#3A2A1A]">Consistency is your greatest advantage.</p>
          <p className="font-reading mt-1 text-sm text-[#3A2A1A]/65">
            Keep a steady pace and trust the process. You're doing great!
          </p>
        </div>
      </div>

      <img
        src={booksAndMug}
        alt=""
        aria-hidden="true"
        className="hidden h-24 w-auto shrink-0 object-contain sm:block"
      />
    </div>
  )
}
