import { AnimatePresence, motion } from 'framer-motion'
import { MoreHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { NAV_ITEMS } from '@/data/nav-items'
import { cn } from '@/lib/utils'

const TABS = NAV_ITEMS.map((item) => ({
  label: item.label === 'Dashboard' ? 'Home' : item.label,
  icon: item.icon,
  to: item.to,
}))

const MAX_VISIBLE = 3

const enabledTabs = TABS.filter((tab) => tab.to !== '#')
const disabledTabs = TABS.filter((tab) => tab.to === '#')
const orderedTabs = [...enabledTabs, ...disabledTabs]
const needsOverflow = orderedTabs.length > MAX_VISIBLE
const primaryTabs = needsOverflow ? orderedTabs.slice(0, MAX_VISIBLE - 1) : orderedTabs
const overflowTabs = needsOverflow ? orderedTabs.slice(MAX_VISIBLE - 1) : []

/** Fixed bottom nav shown in place of the Sidebar's drawer on small screens. */
export function MobileTabBar() {
  const location = useLocation()
  const [showMore, setShowMore] = useState(false)

  const isOverflowActive = overflowTabs.some(
    (tab) => tab.to !== '#' && location.pathname === tab.to,
  )

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-[#3A2A1A]/10 bg-[#FBF3EA] pb-[env(safe-area-inset-bottom)] lg:hidden">
        {primaryTabs.map((tab) => {
          const isDisabled = tab.to === '#'
          const isActive = !isDisabled && location.pathname === tab.to

          if (isDisabled) {
            return (
              <span
                key={tab.label}
                aria-disabled="true"
                title="Coming soon"
                className="flex flex-1 cursor-not-allowed flex-col items-center gap-0.5 py-2 text-center text-[9px] font-medium text-[#3A2A1A]/35"
              >
                <tab.icon className="size-4" />
                {tab.label}
              </span>
            )
          }

          return (
            <Link
              key={tab.label}
              to={tab.to}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 border-t-2 py-2 text-center text-[9px] font-medium transition-colors',
                isActive
                  ? 'border-[#7A2323] text-[#7A2323]'
                  : 'border-transparent text-[#3A2A1A]/60 hover:text-[#3A2A1A]',
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </Link>
          )
        })}

        {needsOverflow && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 border-t-2 py-2 text-center text-[9px] font-medium transition-colors',
              isOverflowActive
                ? 'border-[#7A2323] text-[#7A2323]'
                : 'border-transparent text-[#3A2A1A]/60 hover:text-[#3A2A1A]',
            )}
          >
            <MoreHorizontal className="size-4" />
            More
          </button>
        )}
      </nav>

      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[#3A2A1A]/40 lg:hidden"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[#FBF3EA] pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(58,42,26,0.15)] lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-[#3A2A1A]/10 px-5 py-4">
                <p className="font-semibold text-[#3A2A1A]">More</p>
                <button
                  type="button"
                  onClick={() => setShowMore(false)}
                  aria-label="Close"
                  className="flex size-8 items-center justify-center rounded-full text-[#3A2A1A]/60 hover:bg-[#3A2A1A]/5"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 p-4">
                {overflowTabs.map((tab) => {
                  const isDisabled = tab.to === '#'
                  const isActive = !isDisabled && location.pathname === tab.to

                  if (isDisabled) {
                    return (
                      <span
                        key={tab.label}
                        aria-disabled="true"
                        title="Coming soon"
                        className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-xl py-3 text-center text-xs font-medium text-[#3A2A1A]/35"
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
                      onClick={() => setShowMore(false)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl py-3 text-center text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-[#7A2323]/10 text-[#7A2323]'
                          : 'text-[#3A2A1A]/70 hover:bg-[#3A2A1A]/5',
                      )}
                    >
                      <tab.icon className="size-5" />
                      {tab.label}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
