import { Link, useLocation } from 'react-router-dom'

import { Logo } from '@/components/landing/Logo'
import { NAV_ITEMS } from '@/data/nav-items'
import { cn } from '@/lib/utils'

export function TopNavbar() {
  const location = useLocation()

  return (
    <header className="border-b border-[#3A2A1A]/10 bg-[#FBF3EA]">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-2 px-4 py-3">
        <Logo className="h-9 shrink-0" />

        <nav className="flex w-full items-center justify-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isDisabled = item.to === '#'
            const isActive = !isDisabled && location.pathname === item.to

            if (isDisabled) {
              return (
                <span
                  key={item.label}
                  aria-disabled="true"
                  title="Coming soon"
                  className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg border-b-2 border-transparent px-3 py-2 text-xs font-medium whitespace-nowrap text-[#3A2A1A]/35"
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </span>
              )
            }

            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg border-b-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-[#7A2323] bg-[#7A2323]/10 text-[#7A2323]'
                    : 'border-transparent text-[#3A2A1A]/70 hover:bg-[#3A2A1A]/5',
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
