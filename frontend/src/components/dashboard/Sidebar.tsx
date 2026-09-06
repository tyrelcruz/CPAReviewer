import { ChevronLeft, LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/landing/Logo'
import kabisEmblem from '@/assets/logo/kabis_emblem.png'
import { useAuth } from '@/context/AuthContext'
import { NAV_ITEMS } from '@/data/nav-items'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  collapsed: boolean
  activePath: string
  onNavigate?: () => void
}

function SidebarNav({ collapsed, activePath, onNavigate }: SidebarNavProps) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const isDisabled = item.to === '#'
        const isActive = !isDisabled && activePath === item.to

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
                  <span className="text-[10px] font-semibold tracking-wide uppercase">Soon</span>
                </span>
              )}
            </span>
          )
        }

        return (
          <Link
            key={item.label}
            to={item.to}
            onClick={onNavigate}
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
  )
}

function SidebarLogoutButton({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate?: () => void
}) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    onNavigate?.()
    navigate('/login')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#3A2A1A]/70 transition-colors hover:bg-[#7A2323]/10 hover:text-[#7A2323]',
        collapsed && 'justify-center px-0',
      )}
      title={collapsed ? 'Log out' : undefined}
    >
      <LogOut className="size-4.5 shrink-0" />
      {!collapsed && <span>Log out</span>}
    </button>
  )
}

function SidebarPromoCard() {
  return (
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
  )
}

interface SidebarProps {
  /**
   * Set to false when the consuming page already renders its own mobile
   * nav (e.g. a centered TopNavbar below lg) so Sidebar's floating
   * hamburger + drawer don't double up with it.
   */
  showMobileMenu?: boolean
}

export function Sidebar({ showMobileMenu = true }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <>
      {showMobileMenu && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="fixed top-4 right-4 z-30 flex size-11 items-center justify-center rounded-full border border-[#3A2A1A]/10 bg-[#FBF3EA] text-[#3A2A1A] shadow-md lg:hidden"
        >
          <Menu className="size-5" />
        </button>
      )}

      {showMobileMenu && mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-[#3A2A1A]/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[#FBF3EA] shadow-xl">
            <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-4">
              <Logo className="h-11" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#3A2A1A]/60 hover:bg-[#3A2A1A]/5 hover:text-[#3A2A1A]"
              >
                <X className="size-5" />
              </button>
            </div>

            <SidebarNav
              collapsed={false}
              activePath={location.pathname}
              onNavigate={() => setMobileOpen(false)}
            />
            <div className="mx-3 mb-2 border-t border-[#3A2A1A]/10 pt-2">
              <SidebarLogoutButton collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
            <SidebarPromoCard />
          </aside>
        </div>
      )}

      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-[#3A2A1A]/10 bg-[#FBF3EA] transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-svh lg:overflow-y-auto',
          collapsed ? 'w-20' : 'w-60',
        )}
      >
        <div className={cn('flex flex-col items-center gap-3 px-5 pt-6 pb-4', collapsed && 'px-0')}>
          <div className="group relative">
            {collapsed ? (
              <img
                src={kabisEmblem}
                alt="KABIS"
                className="size-11 object-contain transition-opacity duration-200 group-hover:opacity-0 group-focus-visible:opacity-0"
              />
            ) : (
              <Logo className="h-16 transition-opacity duration-200 group-hover:opacity-0 group-focus-visible:opacity-0" />
            )}
            <button
              type="button"
              onClick={(e) => {
                setCollapsed((v) => !v)
                e.currentTarget.blur()
              }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="absolute inset-0 flex items-center justify-center bg-transparent text-[#3A2A1A]/70 opacity-0 outline-none transition-opacity duration-200 hover:text-[#3A2A1A] group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <ChevronLeft className={cn('size-5 transition-transform duration-200', collapsed && 'rotate-180')} />
            </button>
          </div>
        </div>

        <SidebarNav collapsed={collapsed} activePath={location.pathname} />
        <div className={cn('mx-3 mb-2 border-t border-[#3A2A1A]/10 pt-2', collapsed && 'mx-2')}>
          <SidebarLogoutButton collapsed={collapsed} />
        </div>
        {!collapsed && <SidebarPromoCard />}
      </aside>
    </>
  )
}
