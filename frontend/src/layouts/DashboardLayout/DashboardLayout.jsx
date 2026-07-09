import { useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Wrench, BookOpen, FileText,
  Megaphone, ArrowLeft, Shield, BarChart3, Wallet,
} from 'lucide-react';
import './DashboardLayout.css';

/**
 * DashboardLayout — sidebar chrome for management dashboards.
 *
 * Used by Club Leader (`/club/:clubId/*`), Administrator (`/admin/*`) and
 * Manager (`/manager`) routes only. Renders a left sidebar whose items
 * depend on the route prefix.
 *
 * Renders <Outlet /> — pages inside are NOT expected to wrap themselves
 * in any layout.
 */
export default function DashboardLayout() {
  const { clubId } = useParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = clubId ? buildClubNav(clubId) : buildPortalNav();

  return (
    <div className="dashboard-layout">
      {/* Sidebar — desktop */}
      <aside className="dashboard-layout__sidebar">
        <div className="dashboard-layout__brand">
          <Link to="/" className="dashboard-layout__brand-link">
            <img src="/ClubHub_Logo_White.png" alt="ClubHub" className="dashboard-layout__brand-logo" />
            <span className="dashboard-layout__brand-text">ClubHub</span>
          </Link>
          {clubId && (
            <div className="dashboard-layout__brand-sub">
              <span className="dashboard-layout__brand-eyebrow">Club Context</span>
              <span className="dashboard-layout__brand-club">F-Code</span>
            </div>
          )}
        </div>

        <nav className="dashboard-layout__nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path.endsWith('/dashboard') || item.path === '/admin' || item.path === '/manager'}
                className={({ isActive }) =>
                  `dashboard-layout__nav-item ${isActive ? 'dashboard-layout__nav-item--active' : ''}`
                }
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="dashboard-layout__footer">
          <Link to="/" className="dashboard-layout__back">
            <ArrowLeft size={14} /> Back to Main Portal
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="dashboard-layout__overlay" onClick={() => setIsMobileOpen(false)} />
      )}

      <div className="dashboard-layout__body">
        <header className="dashboard-layout__topbar">
          <button
            className="dashboard-layout__menu-btn"
            onClick={() => setIsMobileOpen((o) => !o)}
            aria-label="Open sidebar"
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="dashboard-layout__topbar-title">Dashboard</div>
        </header>

        <main className="dashboard-layout__main">
          <div className="dashboard-layout__container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      <aside className={`dashboard-layout__drawer ${isMobileOpen ? 'dashboard-layout__drawer--open' : ''}`}>
        <div className="dashboard-layout__brand">
          <Link to="/" className="dashboard-layout__brand-link" onClick={() => setIsMobileOpen(false)}>
            <img src="/ClubHub_Logo_White.png" alt="ClubHub" className="dashboard-layout__brand-logo" />
            <span className="dashboard-layout__brand-text">ClubHub</span>
          </Link>
        </div>
        <nav className="dashboard-layout__nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path.endsWith('/dashboard') || item.path === '/admin' || item.path === '/manager'}
                className={({ isActive }) =>
                  `dashboard-layout__nav-item ${isActive ? 'dashboard-layout__nav-item--active' : ''}`
                }
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}

function buildClubNav(clubId) {
  return [
    { name: 'Dashboard',    path: `/club/${clubId}/dashboard`,   icon: LayoutDashboard },
    { name: 'Members',      path: `/club/${clubId}/members`,     icon: Users },
    { name: 'Events',       path: `/club/${clubId}/events`,      icon: Calendar },
    { name: 'Workshops',    path: `/club/${clubId}/workshops`,   icon: Wrench },
    { name: 'Knowledge',    path: `/club/${clubId}/knowledge`,   icon: BookOpen },
    { name: 'Documents',    path: `/club/${clubId}/documents`,   icon: FileText },
    { name: 'Announcements', path: `/club/${clubId}/announcements`, icon: Megaphone },
    { name: 'Finance',      path: `/club/${clubId}/finance`,     icon: Wallet },
  ];
}

function buildPortalNav() {
  return [
    { name: 'Overview', path: '/admin',        icon: LayoutDashboard },
    { name: 'Users',    path: '/admin/users',  icon: Users },
    { name: 'Roles',    path: '/admin/roles',  icon: Shield },
    { name: 'Reports',  path: '/reports',      icon: BarChart3 },
  ];
}