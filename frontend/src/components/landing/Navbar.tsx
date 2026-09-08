import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Logo } from '@/components/landing/Logo'

// `to` is a real route (rendered as a router Link) when it starts with '/';
// anything else (currently just '#') is an unbuilt placeholder anchor.
const NAV_LINKS = [
  { label: 'Subjects', to: '/subjects' },
  { label: 'Mock Exams', to: '#' },
  { label: 'Pricing', to: '#' },
  { label: 'Resources', to: '#' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="border-b border-[#7A2323]/15">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="inline-block">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => {
            const isDisabled = link.to === '#'

            if (isDisabled) {
              return (
                <span
                  key={link.label}
                  aria-disabled="true"
                  title="Coming soon"
                  className="cursor-not-allowed text-xs font-semibold tracking-widest text-[#3A2A1A]/35 uppercase"
                >
                  {link.label}
                </span>
              )
            }

            return (
              <Link
                key={link.label}
                to={link.to}
                className="text-xs font-semibold tracking-widest text-[#3A2A1A] uppercase hover:text-[#7A2323]"
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/signup"
            className="rounded-full border border-[#3A2A1A] px-5 py-2 text-xs font-semibold tracking-widest text-[#3A2A1A] uppercase transition-colors hover:bg-[#3A2A1A] hover:text-[#F3ECDC]"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="hidden text-xs font-semibold tracking-widest text-[#3A2A1A] uppercase hover:text-[#7A2323] sm:inline"
          >
            Login
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#3A2A1A] hover:bg-[#3A2A1A]/5 lg:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-0.5 border-t border-[#7A2323]/15 px-6 py-3 lg:hidden">
          {NAV_LINKS.map((link) => {
            const isDisabled = link.to === '#'

            if (isDisabled) {
              return (
                <span
                  key={link.label}
                  aria-disabled="true"
                  title="Coming soon"
                  className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide text-[#3A2A1A]/35 uppercase"
                >
                  {link.label}
                  <span className="text-[10px] font-semibold tracking-wide uppercase">Soon</span>
                </span>
              )
            }

            return (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide text-[#3A2A1A] uppercase hover:bg-[#3A2A1A]/5"
              >
                {link.label}
              </Link>
            )
          })}
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide text-[#3A2A1A] uppercase hover:bg-[#3A2A1A]/5 sm:hidden"
          >
            Login
          </Link>
        </nav>
      )}
    </header>
  )
}
