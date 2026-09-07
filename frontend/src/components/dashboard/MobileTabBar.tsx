import { BarChart3, BookOpen, LayoutGrid, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Home', icon: LayoutGrid, to: '/app/dashboard' },
  { label: 'Subjects', icon: BookOpen, to: '#' },
  { label: 'Progress', icon: BarChart3, to: '#' },
  { label: 'Settings', icon: Settings, to: '#' },
]

/** Fixed bottom nav shown in place of the Sidebar's drawer on small screens. */
export function MobileTabBar() {
  const location = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[#3A2A1A]/10 bg-[#FBF3EA] pb-[env(safe-area-inset-bottom)] lg:hidden">
      {TABS.map((tab) => {
        const isDisabled = tab.to === '#'
        const isActive = !isDisabled && location.pathname === tab.to

        if (isDisabled) {
          return (
            <span
              key={tab.label}
              aria-disabled="true"
              title="Coming soon"
              className="flex flex-1 cursor-not-allowed flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-[#3A2A1A]/35"
            >
              <tab.icon className="size-5" />
              {tab.label}
            </span>
          )
        }

        return (
          <Link
            key={tab.label}
            to={tab.to}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 border-t-2 py-2.5 text-[11px] font-medium transition-colors',
              isActive
                ? 'border-[#7A2323] text-[#7A2323]'
                : 'border-transparent text-[#3A2A1A]/60 hover:text-[#3A2A1A]',
            )}
          >
            <tab.icon className="size-5" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
