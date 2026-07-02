import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Search, Bell } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Clubs', href: '/clubs' },
  { label: 'Events', href: '/events' },
  { label: 'Knowledge Base', href: '/knowledge' },
  { label: 'AI Assistant', href: '/ai' },
  { label: 'Announcements', href: '/announcements' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
        style={{ background: 'linear-gradient(135deg,#0E4B43,#22C55E)' }}
      >
        CH
      </div>
      <div className="leading-tight">
        <span className="text-white font-bold text-base tracking-tight">ClubHub</span>
        <span className="font-bold text-base" style={{ color: '#4ADE80' }}> FPTU</span>
      </div>
    </Link>
  );
}

function NavItem({ link, onClick }) {
  return (
    <NavLink
      to={link.href}
      end={link.href === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
          isActive
            ? 'bg-[#22C55E]/10'
            : 'hover:bg-white/5'
        )
      }
      style={({ isActive }) => ({ color: isActive ? '#4ADE80' : '#D2C7B8' })}
    >
      {link.label}
    </NavLink>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center"
      style={{
        height: 80,
        background: 'rgba(6,35,29,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="w-full max-w-[1280px] mx-auto px-6 flex items-center justify-between">
        <Logo />

        <ul className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <NavItem link={l} />
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: '#D2C7B8' }}
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors relative"
            style={{ color: '#D2C7B8' }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#22C55E]" />
          </button>
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            style={{ background: 'linear-gradient(90deg,#0E4B43,#22C55E)' }}
          >
            Sign In
          </Link>
        </div>

        <button
          className="lg:hidden hover:text-white"
          style={{ color: '#D2C7B8' }}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          className="absolute top-full left-0 right-0 lg:hidden py-4 px-6 flex flex-col gap-1"
          style={{ background: 'rgba(6,35,29,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {NAV_LINKS.map((l) => (
            <NavItem key={l.href} link={l} onClick={() => setOpen(false)} />
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="mt-2 py-3 rounded-xl text-sm font-semibold text-white text-center"
            style={{ background: 'linear-gradient(90deg,#0E4B43,#22C55E)' }}
          >
            Sign In
          </Link>
        </div>
      )}
    </nav>
  );
}