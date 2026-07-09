import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, Settings, ChevronDown, Building2, CreditCard, LayoutDashboard, Users, Shield, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useAuth } from '@/hooks/useAuth.jsx';

const LOGO_URL = '/ClubHub_Logo_White.png';
import { ROLES, ROLE_META } from '@/auth/rolePermissions.js';

const PUBLIC_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Clubs', href: '/clubs' },
  { label: 'Events', href: '/events' },
  { label: 'AI Assistant', href: '/ai' },
  { label: 'Announcements', href: '/announcements' },
];

const LEADER_LINKS = [
  { label: 'Knowledge Base', href: '/knowledge' },
];

/* Navigation links per role */
const ROLE_NAV = {
  [ROLES.STUDENT]: [
    { label: 'My Clubs', href: '/my-clubs', icon: Building2 },
    { label: 'My Registrations', href: '/my-registrations', icon: CalendarCheck },
  ],
  [ROLES.CLUB_MEMBER]: [
    { label: 'My Clubs', href: '/my-clubs', icon: Building2 },
    { label: 'My Registrations', href: '/my-registrations', icon: CalendarCheck },
    { label: 'Finance', href: '/finance', icon: CreditCard },
  ],
  [ROLES.CLUB_LEADER]: [
    { label: 'My Clubs', href: '/my-clubs', icon: Building2 },
    { label: 'My Registrations', href: '/my-registrations', icon: CalendarCheck },
    { label: 'Finance', href: '/finance', icon: CreditCard },
  ],
  [ROLES.MENTOR]: [
    { label: 'My Clubs', href: '/my-clubs', icon: Building2 },
  ],
  [ROLES.MANAGER]: [
    { label: 'IC-PDP Dashboard', href: '/manager', icon: LayoutDashboard },
  ],
  [ROLES.ADMINISTRATOR]: [
    { label: 'Admin Dashboard', href: '/admin', icon: Shield },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Roles', href: '/admin/roles', icon: Shield },
  ],
};

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
        style={{ background: 'linear-gradient(135deg,#0E4B43,#22C55E)' }}
      >
        <img src={LOGO_URL} alt="ClubHub logo" className="w-full h-full object-cover" />
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
  const [userOpen, setUserOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isAuthenticated, user, profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleMeta = ROLE_META[role] || null;
  const roleNavLinks = ROLE_NAV[role] || [];

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserOpen(false);
    navigate('/');
  };

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
          {PUBLIC_LINKS.map((l) => (
            <li key={l.href}>
              <NavItem link={l} />
            </li>
          ))}
          {isAuthenticated && role === ROLES.CLUB_LEADER && LEADER_LINKS.map((l) => (
            <li key={l.href}>
              <NavItem link={l} />
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          {!loading && (
            <>
              {isAuthenticated ? (
                <>
                  <button
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
                    style={{ color: '#D2C7B8' }}
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#22C55E]" />
                  </button>

                  <div className="relative" ref={dropdownRef}>
                      <button
                        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                        onClick={() => setUserOpen((o) => !o)}
                        aria-expanded={userOpen}
                        aria-haspopup="true"
                      >
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={displayName}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg,#0E4B43,#22C55E)' }}
                          >
                            {initials}
                          </div>
                        )}
                        <span
                          className="text-sm font-medium text-[#D2C7B8] max-w-[120px] truncate"
                          style={{ maxWidth: 120 }}
                        >
                          {displayName}
                        </span>
                        <ChevronDown
                          size={14}
                          style={{
                            color: '#D2C7B8',
                            transform: userOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </button>

                    {userOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden z-50"
                        style={{
                          background: '#ffffff',
                          border: '1px solid rgba(6,35,29,0.08)',
                          boxShadow: '0 8px 32px rgba(6,35,29,0.12)',
                        }}
                      >
                        <div
                          className="px-4 py-3 border-b"
                          style={{ borderColor: 'rgba(6,35,29,0.08)' }}
                        >
                          <p className="text-sm font-semibold" style={{ color: '#06231D' }}>
                            {displayName}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#16685D' }}>
                            {user?.email}
                          </p>
                          {roleMeta && (
                            <span
                              className="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ background: `${roleMeta.color}20`, color: roleMeta.color }}
                            >
                              {roleMeta.label}
                            </span>
                          )}
                        </div>

                        {roleNavLinks.length > 0 && (
                          <nav className="py-2">
                            {roleNavLinks.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.href}
                                  to={item.href}
                                  onClick={() => setUserOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#F4F1EA] transition-colors"
                                  style={{ color: '#06231D' }}
                                >
                                  <Icon size={15} style={{ color: '#16685D' }} />
                                  {item.label}
                                </Link>
                              );
                            })}
                          </nav>
                        )}

                        <nav className="py-2" style={{ borderTop: '1px solid rgba(6,35,29,0.06)' }}>
                          <Link
                            to="/profile"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#F4F1EA] transition-colors"
                            style={{ color: '#06231D' }}
                          >
                            <User size={15} style={{ color: '#16685D' }} />
                            My Profile
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#F4F1EA] transition-colors"
                            style={{ color: '#06231D' }}
                          >
                            <Settings size={15} style={{ color: '#16685D' }} />
                            Settings
                          </Link>
                        </nav>
                        <div
                          className="py-2 border-t"
                          style={{ borderColor: 'rgba(6,35,29,0.08)' }}
                        >
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm w-full hover:bg-red-50 transition-colors"
                            style={{ color: '#B91C1C' }}
                          >
                            <LogOut size={15} />
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    style={{ background: 'linear-gradient(90deg,#0E4B43,#22C55E)' }}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </>
          )}
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
          {PUBLIC_LINKS.map((l) => (
            <NavItem key={l.href} link={l} onClick={() => setOpen(false)} />
          ))}
          {!loading && isAuthenticated && role === ROLES.CLUB_LEADER && LEADER_LINKS.map((l) => (
            <NavItem key={l.href} link={l} onClick={() => setOpen(false)} />
          ))}
          {!loading && (
            <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 py-2.5 rounded-xl text-sm text-[#D2C7B8] hover:text-white"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-6 h-6 rounded-lg object-cover"
                      />
                    ) : (
                      <User size={15} />
                    )}
                    {displayName}
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setOpen(false); }}
                    className="flex items-center gap-2 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 text-left"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="py-2.5 rounded-xl text-sm font-semibold text-[#D2C7B8] hover:text-white text-center border border-white/15"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="py-2.5 rounded-xl text-sm font-semibold text-white text-center"
                    style={{ background: 'linear-gradient(90deg,#0E4B43,#22C55E)' }}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}