import { Link } from 'react-router-dom'

import { Logo } from '@/components/landing/Logo'

const NAV_LINKS = [
  'Product',
  'Subjects',
  'Question Bank',
  'Mock Exams',
  'Pricing',
  'Resources',
]

export function Navbar() {
  return (
    <header className="border-b border-[#7A2323]/15">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs font-semibold tracking-widest text-[#3A2A1A] uppercase hover:text-[#7A2323]"
            >
              {link}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/app"
            className="rounded-full border border-[#3A2A1A] px-5 py-2 text-xs font-semibold tracking-widest text-[#3A2A1A] uppercase transition-colors hover:bg-[#3A2A1A] hover:text-[#F3ECDC]"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="hidden text-xs font-semibold tracking-widest text-[#3A2A1A] uppercase hover:text-[#7A2323] sm:inline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  )
}
