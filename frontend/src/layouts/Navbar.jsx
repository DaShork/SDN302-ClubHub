import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationCount } from '../hooks/useNotificationCount';
import { Loader } from '../components/shared/Loader';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/clubs', label: 'Clubs' },
  { to: '/events', label: 'Events' },
  { to: '/knowledge', label: 'Knowledge Base' },
  { to: '/ai', label: 'AI Assistant', gradient: true },
  { to: '/announcements', label: 'Announcements' },
  { to: '/reports', label: 'Reports' },
];

export function Navbar() {
  const location = useLocation();
  const { profile, role, loading, signOut } = useAuth();
  const { count } = useNotificationCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center" style={{ backgroundColor: 'rgba(6,35,29,0.95)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-[1280px] mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(90deg, #0E4B43, #22C55E)' }}>
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-secondary-100 font-semibold text-lg tracking-wide hidden sm:block">ClubHub</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, gradient }) => (
            <li key={to}>
              <Link
                to={to}
                className={`px-4 py-2 rounded-button text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? 'text-accent-green'
                    : gradient
                    ? 'bg-gradient-to-r from-primary-800 to-accent-green bg-clip-text text-transparent font-semibold'
                    : 'text-secondary-100 hover:text-accent-green'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications bell */}
          <Link
            to="/notifications"
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-secondary-100 hover:text-accent-green transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center px-1">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>

          {/* Profile dropdown */}
          {loading ? (
            <div className="w-9 h-9"><Loader size="sm" /></div>
          ) : profile ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-button hover:bg-primary-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: 'linear-gradient(90deg, #0E4B43, #22C55E)' }}>
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-sm text-secondary-100 hidden md:block">{profile.full_name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary-200 hidden md:block">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-card border py-2 z-50" style={{ backgroundColor: '#0D1824', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-medium text-secondary-100 truncate">{profile.full_name}</p>
                    <p className="text-xs text-muted truncate">{profile.email}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green">{role}</span>
                  </div>
                  <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-100 hover:bg-primary-600 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile
                  </Link>
                  <Link to="/payment" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-100 hover:bg-primary-600 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Club Fund
                  </Link>
                  <div className="border-t mt-1 pt-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <button
                      onClick={() => { signOut(); setProfileOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger hover:bg-primary-600 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 rounded-button text-sm font-medium text-secondary-100 hover:text-accent-green transition-colors">Sign In</Link>
              <Link to="/register" className="px-4 py-2 rounded-button text-sm font-medium text-white transition-all" style={{ background: 'linear-gradient(90deg, #0E4B43, #22C55E)' }}>
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 text-secondary-100"
          >
            <span className={`block w-5 h-0.5 bg-current transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}/>
            <span className={`block w-5 h-0.5 bg-current transition-opacity ${menuOpen ? 'opacity-0' : ''}`}/>
            <span className={`block w-5 h-0.5 bg-current transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 border-t" style={{ backgroundColor: 'rgba(6,35,29,0.98)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <ul className="px-6 py-4 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 rounded-button text-sm font-medium ${
                    isActive(to) ? 'text-accent-green bg-primary-800' : 'text-secondary-100'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
