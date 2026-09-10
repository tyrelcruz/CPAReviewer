import {
  BarChart3,
  FileText,
  Flag,
  LayoutGrid,
  Layers,
  LogOut,
  Menu,
  Settings,
  Sun,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import mountainLandscape from '@/assets/images/mountain_landscape.png'
import { Logo } from '@/components/landing/Logo'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface AdminNavItem {
  label: string
  icon: LucideIcon
  to: string
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, to: '/admin' },
  { label: 'Flagged Questions', icon: Flag, to: '/admin/flagged-questions' },
  { label: 'Users', icon: Users, to: '#' },
  { label: 'Exams', icon: FileText, to: '#' },
  { label: 'Question Bank', icon: Layers, to: '#' },
  { label: 'Analytics', icon: BarChart3, to: '#' },
  { label: 'Settings', icon: Settings, to: '#' },
]

function AdminSidebarNav({ activePath, onNavigate }: { activePath: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {ADMIN_NAV_ITEMS.map((item) => {
        const isDisabled = item.to === '#'
        const isActive = !isDisabled && activePath === item.to

        if (isDisabled) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              title="Coming soon"
              className="flex cursor-not-allowed items-center gap-3 rounded-lg border-l-[3px] border-transparent px-3 py-2.5 text-sm font-medium text-[#3A2A1A]/35"
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="flex flex-1 items-center justify-between gap-2">
                {item.label}
                <span className="text-[10px] font-semibold tracking-wide uppercase">Soon</span>
              </span>
            </span>
          )
        }

        return (
          <Link
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-[#7A2323] bg-[#7A2323]/10 text-[#7A2323]'
                : 'border-transparent text-[#3A2A1A]/70 hover:bg-[#3A2A1A]/5',
            )}
          >
            <item.icon className="size-4.5 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function AdminSidebarPromoCard() {
  return (
    <div className="relative mx-4 mb-4 overflow-hidden rounded-2xl border border-[#3A2A1A]/10 bg-white p-4">
      <Sun className="mx-auto size-5 fill-[#E0AC48] text-[#E0AC48]" aria-hidden="true" />
      <p className="font-display mt-2 text-center text-lg leading-tight text-[#7A2323] uppercase">
        Stronger learners,
        <br />
        higher dreams.
      </p>
      <p className="font-reading mt-2 text-center text-xs text-[#3A2A1A]/60">
        Every account here is a future CPA in progress.
      </p>
      <p className="mt-2 text-center text-sm text-[#3A5A40]/50" aria-hidden="true">
        〜
      </p>
      <div className="relative -mx-4 -mb-4 mt-1 h-20 w-[calc(100%+2rem)]">
        <img
          src={mountainLandscape}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom"
        />
      </div>
    </div>
  )
}

function AdminSidebarLogoutButton({ onNavigate }: { onNavigate?: () => void }) {
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
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#3A2A1A]/70 transition-colors hover:bg-[#7A2323]/10 hover:text-[#7A2323]"
    >
      <LogOut className="size-4.5 shrink-0" />
      Log out
    </button>
  )
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed top-4 right-4 z-30 flex size-11 items-center justify-center rounded-full border border-[#3A2A1A]/10 bg-[#FBF3EA] text-[#3A2A1A] shadow-md lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {mobileOpen && (
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

            <AdminSidebarNav activePath={location.pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mx-3 mb-2 border-t border-[#3A2A1A]/10 pt-2">
              <AdminSidebarLogoutButton onNavigate={() => setMobileOpen(false)} />
            </div>
            <AdminSidebarPromoCard />
          </aside>
        </div>
      )}

      <aside className="hidden w-60 shrink-0 flex-col border-r border-[#3A2A1A]/10 bg-[#FBF3EA] lg:sticky lg:top-0 lg:flex lg:h-svh lg:overflow-y-auto">
        <div className="flex flex-col items-center gap-3 px-5 pt-6 pb-4">
          <Logo className="h-16" />
        </div>

        <AdminSidebarNav activePath={location.pathname} />
        <div className="mx-3 mb-2 border-t border-[#3A2A1A]/10 pt-2">
          <AdminSidebarLogoutButton />
        </div>
        <AdminSidebarPromoCard />
      </aside>
    </>
  )
}
