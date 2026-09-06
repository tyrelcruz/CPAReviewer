import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Logo } from '@/components/landing/Logo'
import { NAV_ITEMS } from '@/data/nav-items'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-[#3A2A1A]/10 bg-[#FBF3EA] transition-[width] duration-200',
        collapsed ? 'w-20' : 'w-60',
      )}
    >
      <div className={cn('flex flex-col gap-3 px-5 pt-6 pb-4', collapsed && 'items-center px-0')}>
        <Logo className={collapsed ? 'h-9' : 'h-11'} />
        {!collapsed && (
          <span className="font-baybayin text-lg text-[#3A5A40]/70" aria-hidden="true">
            pasa
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isDisabled = item.to === '#'
          const isActive = !isDisabled && location.pathname === item.to

          if (isDisabled) {
            return (
              <span
                key={item.label}
                aria-disabled="true"
                className={cn(
                  'flex cursor-not-allowed items-center gap-3 rounded-lg border-l-[3px] border-transparent px-3 py-2.5 text-sm font-medium text-[#3A2A1A]/35',
                  collapsed && 'justify-center px-0',
                )}
                title={collapsed ? `${item.label} (coming soon)` : 'Coming soon'}
              >
                <item.icon className="size-4.5 shrink-0" />
                {!collapsed && (
                  <span className="flex flex-1 items-center justify-between gap-2">
                    {item.label}
                    <span className="text-[10px] font-semibold tracking-wide uppercase">
                      Soon
                    </span>
                  </span>
                )}
              </span>
            )
          }

          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-[3px] border-[#7A2323] bg-[#7A2323]/10 text-[#7A2323]'
                  : 'border-l-[3px] border-transparent text-[#3A2A1A]/70 hover:bg-[#3A2A1A]/5',
                collapsed && 'justify-center px-0',
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="size-4.5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="mx-4 mb-4 rounded-2xl border border-[#3A2A1A]/10 bg-white p-4">
          <p className="text-center text-lg text-[#3A5A40]/70" aria-hidden="true">
            〜◡〜
          </p>
          <p className="font-display mt-1 text-center text-lg leading-tight">
            <span className="text-[#7A2323]">Pass smarter.</span>
            <br />
            <span className="text-[#3A5A40]">Not harder.</span>
          </p>
          <p className="font-reading mt-2 text-center text-xs text-[#3A2A1A]/70">
            Focus your time on what really matters.
          </p>
          <p className="mt-2 text-center text-sm text-[#3A5A40]/70" aria-hidden="true">
            〜◡〜
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex items-center justify-center border-t border-[#3A2A1A]/10 py-3 text-[#3A2A1A]/50 hover:bg-[#3A2A1A]/5 hover:text-[#3A2A1A]"
      >
        <ChevronLeft className={cn('size-4 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </aside>
  )
}
