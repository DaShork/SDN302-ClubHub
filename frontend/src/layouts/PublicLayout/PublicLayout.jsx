import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar/Navbar.jsx';
import Footer from '@/components/Footer/Footer.jsx';
import './PublicLayout.css';

/**
 * PublicLayout — the canonical chrome for top-level public and authenticated
 * "portal" pages (Home, Clubs, Events, AI, Profile, My Clubs, …).
 *
 * Structure:
 *   ┌──────────────────────────────────────────┐
 *   │ Navbar (fixed top, full width)           │  ← existing top-nav
 *   ├──────────────────────────────────────────┤
 *   │                                          │
 *   │  <Outlet />  (page content)              │  ← padded below navbar
 *   │                                          │
 *   ├──────────────────────────────────────────┤
 *   │ Footer                                   │
 *   └──────────────────────────────────────────┘
 *
 * Sidebar is intentionally NOT rendered here. Pages that need a sidebar
 * (Club Leader / Manager / Administrator dashboards) use DashboardLayout.
 */
export default function PublicLayout() {
  return (
    <div className="public-layout">
      <Navbar />
      <main className="public-layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}