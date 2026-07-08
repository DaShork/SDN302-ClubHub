import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  {
    title: 'Platform',
    links: [
      { to: '/', label: 'Home' },
      { to: '/clubs', label: 'Clubs' },
      { to: '/events', label: 'Events' },
      { to: '/knowledge', label: 'Knowledge Base' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { to: '/ai', label: 'AI Assistant' },
      { to: '/announcements', label: 'Announcements' },
      { to: '/reports', label: 'Reports' },
      { to: '/alumni', label: 'Alumni' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/login', label: 'Sign In' },
      { to: '/register', label: 'Register' },
      { to: '/profile', label: 'Profile' },
      { to: '/payment', label: 'Club Fund' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t" style={{ backgroundColor: '#06231D', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="w-full max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(90deg, #0E4B43, #22C55E)' }}>
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-secondary-100 font-semibold text-lg">ClubHub</span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(244,241,234,0.5)' }}>
              The central hub for FPT University student clubs. Discover, connect, and grow together.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-secondary-200"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" aria-label="YouTube" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary-200"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="rgba(6,35,29)"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-secondary-200"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          {FOOTER_LINKS.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-secondary-100 mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-sm transition-colors hover:text-accent-green" style={{ color: 'rgba(244,241,234,0.5)' }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm" style={{ color: 'rgba(244,241,234,0.4)' }}>
            &copy; {new Date().getFullYear()} ClubHub – FPT University. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm transition-colors hover:text-accent-green" style={{ color: 'rgba(244,241,234,0.4)' }}>Privacy</a>
            <a href="#" className="text-sm transition-colors hover:text-accent-green" style={{ color: 'rgba(244,241,234,0.4)' }}>Terms</a>
            <a href="#" className="text-sm transition-colors hover:text-accent-green" style={{ color: 'rgba(244,241,234,0.4)' }}>Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
