import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { Loader } from '../components/shared/Loader';

const AIChatPage = lazy(() => import('../pages/AIChat/AIChatPage').then(m => ({ default: m.default })));
const NotificationsPage = lazy(() => import('../pages/Notifications/NotificationsPage').then(m => ({ default: m.default })));
const PaymentPage = lazy(() => import('../pages/Payment/PaymentPage').then(m => ({ default: m.default })));
const AlumniPage = lazy(() => import('../pages/Alumni/AlumniPage').then(m => ({ default: m.default })));
const ReportsPage = lazy(() => import('../pages/Reports/ReportsPage').then(m => ({ default: m.default })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader size="lg" />
    </div>
  );
}

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center px-6">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          FPT University Club Management
        </div>
        <h1 className="text-5xl font-bold text-secondary-100 mb-4 leading-tight">
          Your Club. <br/>
          <span style={{ background: 'linear-gradient(90deg, #0E4B43, #22C55E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>One Platform.</span>
        </h1>
        <p className="text-lg mb-8" style={{ color: 'rgba(244,241,234,0.6)' }}>
          Discover clubs, access knowledge, join events, and connect with your university community — all in one place.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="/clubs" className="px-8 py-3 rounded-button font-semibold text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(90deg, #0E4B43, #22C55E)' }}>
            Explore Clubs
          </a>
          <a href="/ai" className="px-8 py-3 rounded-button font-semibold border transition-all hover:bg-primary-800" style={{ borderColor: '#22C55E', color: '#22C55E' }}>
            Ask AI
          </a>
        </div>
      </div>

      {/* Feature grid */}
      <div className="w-full max-w-[1280px] mx-auto px-6 mt-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Clubs', desc: 'Browse & join student clubs', href: '/clubs' },
            { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Events', desc: 'Discover upcoming events', href: '/events' },
            { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', title: 'AI Assistant', desc: 'Search club knowledge', href: '/ai' },
            { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', title: 'Knowledge Base', desc: 'Club articles & docs', href: '/knowledge' },
          ].map(({ icon, title, desc, href }) => (
            <a key={title} href={href} className="card-base p-6 group cursor-pointer">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={icon}/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-secondary-100 mb-1 group-hover:text-accent-green transition-colors">{title}</h3>
              <p className="text-sm" style={{ color: 'rgba(244,241,234,0.5)' }}>{desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StubPage({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(34,197,94,0.1)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-secondary-100 mb-3">{title}</h1>
      <p className="text-base max-w-md" style={{ color: 'rgba(244,241,234,0.5)' }}>{description}</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/ai" element={<AIChatPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/alumni" element={<AlumniPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/clubs" element={<StubPage title="Clubs" description="Browse and discover student clubs at FPT University." />} />
          <Route path="/events" element={<StubPage title="Events" description="Discover and register for upcoming club events." />} />
          <Route path="/knowledge" element={<StubPage title="Knowledge Base" description="Explore articles, meeting minutes, and club resources." />} />
          <Route path="/announcements" element={<StubPage title="Announcements" description="Latest news and updates from clubs and IC-PDP." />} />
          <Route path="/login" element={<StubPage title="Sign In" description="Sign in to your ClubHub account." />} />
          <Route path="/register" element={<StubPage title="Register" description="Create your ClubHub account." />} />
          <Route path="/profile" element={<StubPage title="Profile" description="Manage your profile and account settings." />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
