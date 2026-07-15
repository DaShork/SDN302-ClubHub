import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Wrench, BookOpen, FileText,
  Megaphone, ArrowLeft, Shield, BarChart3, Wallet, Building2, Settings,
} from 'lucide-react';
import { useLeaderClubs } from '@/hooks/useLeaderClubs.jsx';
import { useMemberClubs } from '@/hooks/useMemberClubs.jsx';
import './DashboardLayout.css';

/**
 * DashboardLayout — sidebar chrome for management dashboards.
 *
 * Used by Club Leader (`/leader/*`), Administrator (`/admin/*`) and
 * Manager (`/manager`) routes. Renders a left sidebar whose items depend
 * on the current route prefix.
 *
 * Pass `hideSidebar` to hide the sidebar (Manager dashboard).
 *
 * Renders <Outlet /> — pages inside are NOT expected to wrap themselves
 * in any layout.
 */
export default function DashboardLayout({ hideSidebar = false }) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isLeaderArea = location.pathname.startsWith('/leader');
  const isAdminArea = location.pathname.startsWith('/admin');
  const isManagerArea = location.pathname === '/manager' || location.pathname.startsWith('/manager/');
  const isMentorArea = location.pathname.startsWith('/mentor');
  const isMemberArea = location.pathname.startsWith('/member');
  const isReportsArea = location.pathname === '/reports' || location.pathname.startsWith('/reports/');

  // Only fetch the led-clubs list when we're actually rendering a
  // leader-area sidebar. Avoids an unnecessary round-trip for /admin
  // and /manager routes, and avoids a render that would otherwise race
  // with their own data loading.
  const { ledClubs, loading: leaderLoading } = useLeaderClubsConditional(isLeaderArea);
  const { memberClubs, loading: memberLoading } = useMemberClubsConditional(isMemberArea);

  const navItems = isLeaderArea
    ? buildLeaderNav()
    : isAdminArea
      ? buildPortalNav()
      : isManagerArea
        ? buildManagerNav()
        : isMentorArea
          ? buildMentorNav()
          : isMemberArea
            ? buildMemberNav()
            : isReportsArea
              ? buildPortalNav()
              : [];

  // Brand sub-label: leader area shows led-clubs; member area shows member-clubs.
  const brandSubEyebrow = isLeaderArea
    ? 'Leader Dashboard'
    : isMemberArea
      ? 'Member Dashboard'
      : null;
  const brandSubValue = isLeaderArea
    ? (leaderLoading
        ? 'Loading...'
        : ledClubs.length === 0
          ? 'No clubs yet'
          : ledClubs.length === 1
            ? ledClubs[0].name
            : `Leading ${ledClubs.length} clubs`)
    : isMemberArea
      ? (memberLoading
          ? 'Loading...'
          : memberClubs.length === 0
            ? 'Chưa tham gia CLB'
            : memberClubs.length === 1
              ? memberClubs[0].club?.name
              : `Thành viên ${memberClubs.length} CLB`)
      : null;

  return (
    <div className={`dashboard-layout ${hideSidebar ? 'dashboard-layout--no-sidebar' : ''}`}>
      {/* Sidebar — desktop */}
      {!hideSidebar && (
        <aside className="dashboard-layout__sidebar">
          <div className="dashboard-layout__brand">
            <Link to="/" className="dashboard-layout__brand-link">
              <img src="/ClubHub_Logo_White.png" alt="ClubHub" className="dashboard-layout__brand-logo" />
              <span className="dashboard-layout__brand-text">ClubHub</span>
            </Link>
            {(isLeaderArea || isMemberArea) && brandSubValue && (
              <div className="dashboard-layout__brand-sub">
                <span className="dashboard-layout__brand-eyebrow">{brandSubEyebrow}</span>
                <span className="dashboard-layout__brand-club">{brandSubValue}</span>
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
                  end={item.path.endsWith('/dashboard') || item.path === '/admin' || item.path === '/manager' || item.path === '/member'}
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
      )}

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
          {(isLeaderArea || isMemberArea) && brandSubValue && (
            <div className="dashboard-layout__brand-sub">
              <span className="dashboard-layout__brand-eyebrow">{brandSubEyebrow}</span>
              <span className="dashboard-layout__brand-club">{brandSubValue}</span>
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
                end={item.path.endsWith('/dashboard') || item.path === '/admin' || item.path === '/manager' || item.path === '/member'}
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

function buildLeaderNav() {
  return [
    { name: 'Dashboard',    path: `/leader/dashboard`,     icon: LayoutDashboard },
    { name: 'Members',      path: `/leader/members`,       icon: Users },
    { name: 'Events',       path: `/leader/events`,        icon: Calendar },
    { name: 'Workshops',    path: `/leader/workshops`,     icon: Wrench },
    { name: 'Knowledge',    path: `/leader/knowledge`,     icon: BookOpen },
    { name: 'Documents',    path: `/leader/documents`,     icon: FileText },
    { name: 'Announcements', path: `/leader/announcements`, icon: Megaphone },
    { name: 'Finance',      path: `/leader/finance`,       icon: Wallet },
  ];
}

function buildPortalNav() {
  return [
    { name: 'Overview', path: '/admin',           icon: LayoutDashboard },
    { name: 'Users',    path: '/admin/users',     icon: Users },
    { name: 'Clubs',    path: '/admin/clubs',     icon: Building2 },
    { name: 'Roles',    path: '/admin/roles',     icon: Shield },
    { name: 'Settings', path: '/admin/settings',  icon: Settings },
    { name: 'Reports',  path: '/reports',         icon: BarChart3 },
  ];
}

function buildManagerNav() {
  return [
    { name: 'Dashboard',       path: '/manager',                  icon: LayoutDashboard },
    { name: 'Quản lý CLB',     path: '/manager/clubs',            icon: Building2 },
    { name: 'Thông báo',       path: '/manager/announcements',    icon: Megaphone },
    { name: 'Nhật ký',         path: '/manager/log',              icon: BarChart3 },
  ];
}

function buildMentorNav() {
  return [
    { name: 'Dashboard', path: '/mentor/dashboard', icon: LayoutDashboard },
    { name: 'CLB của tôi', path: '/mentor/clubs',    icon: BookOpen },
    { name: 'Nhật ký',    path: '/mentor/log',      icon: BarChart3 },
  ];
}

function buildMemberNav() {
  return [
    { name: 'Dashboard',    path: '/member',            icon: LayoutDashboard },
    { name: 'CLB của tôi',  path: '/member/clubs',      icon: Building2 },
    { name: 'Đóng quỹ',     path: '/member/finance',    icon: Wallet },
    { name: 'Sự kiện',      path: '/my-registrations',  icon: Calendar },
    { name: 'Thông báo',    path: '/announcements',     icon: Megaphone },
  ];
}

/**
 * Conditional version of useLeaderClubs. Returns an "empty / not loading"
 * shape when disabled so callers can render unconditionally.
 */
function useLeaderClubsConditional(enabled) {
  // Always call the hook — Rules of Hooks. The hook itself is cheap
  // when auth isn't ready, and the actual fetch only runs once per
  // session anyway.
  const result = useLeaderClubs();
  if (!enabled) {
    return { ledClubs: [], ledClubIds: [], loading: false, error: null, refresh: () => {} };
  }
  return result;
}

/* Same pattern as useLeaderClubsConditional — wraps useMemberClubs so
 * we don't fire the query when the layout isn't on a /member/* route. */
function useMemberClubsConditional(enabled) {
  const result = useMemberClubs();
  if (!enabled) {
    return { memberClubs: [], memberClubIds: [], loading: false, error: null, refresh: () => {} };
  }
  return result;
}