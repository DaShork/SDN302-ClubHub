import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/clubs', label: 'Clubs' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
]

const myLinks = [
  { href: '/my-clubs', label: 'My Clubs' },
  { href: '/my-registrations', label: 'My Registrations' },
  { href: '/check-in', label: 'Check-in' },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isMyActive = myLinks.some((l) => location.pathname.startsWith(l.href))

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-primary-900/95 backdrop-blur-md border-b border-white/5">
      <div className="h-full container flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-800 to-accent-green flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-xl font-semibold text-secondary-100 hidden sm:block">
            ClubHub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname === link.href
                  ? 'text-accent-green bg-accent-green/10'
                  : 'text-secondary-200 hover:text-secondary-100 hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* My dropdown */}
          <div className="relative group">
            <NavLink
              to="/my-clubs"
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                isMyActive
                  ? 'text-accent-green bg-accent-green/10'
                  : 'text-secondary-200 hover:text-secondary-100 hover:bg-white/5'
              )}
            >
              My
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </NavLink>
            <div className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-card border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {myLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'block px-4 py-3 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl',
                    location.pathname === link.href
                      ? 'text-accent-green bg-accent-green/10'
                      : 'text-secondary-200 hover:bg-white/5 hover:text-secondary-100'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Log in
          </Button>
          <Button size="sm">
            Sign up
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-secondary-200 hover:text-secondary-100"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-900 border-t border-white/5">
          <div className="container py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === link.href
                    ? 'text-accent-green bg-accent-green/10'
                    : 'text-secondary-200 hover:text-secondary-100 hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-white/5">
              <p className="px-4 py-2 text-xs uppercase tracking-wider text-secondary-400">
                My
              </p>
              {myLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'text-accent-green bg-accent-green/10'
                      : 'text-secondary-200 hover:text-secondary-100 hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
              <Button variant="ghost" className="w-full justify-center">
                Log in
              </Button>
              <Button className="w-full justify-center">
                Sign up
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
