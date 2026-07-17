import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';
import ConnectionBanner from '@/components/common/ConnectionBanner.jsx';
import HomePage from '@/pages/HomePage/HomePage.jsx';
import ClubsPage from '@/pages/ClubsPage/ClubsPage.jsx';
import ClubDetailPage from '@/pages/ClubDetailPage/ClubDetailPage.jsx';
import EventsPage from '@/pages/EventsPage/EventsPage.jsx';
import EventDetailPage from '@/pages/EventDetailPage/EventDetailPage.jsx';
import AIPage from '@/pages/AIPage/AIPage.jsx';
import AnnouncementsPage from '@/pages/AnnouncementsPage/AnnouncementsPage.jsx';
import LoginPage from '@/pages/LoginPage/LoginPage.jsx';
import SignUpPage from '@/pages/SignUpPage/SignUpPage.jsx';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage/ForgotPasswordPage.jsx';
import ResetPasswordPage from '@/pages/ResetPasswordPage/ResetPasswordPage.jsx';
import ProfilePage from '@/pages/ProfilePage/ProfilePage.jsx';
import SettingsPage from '@/pages/SettingsPage/SettingsPage.jsx';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute.jsx';
import GuestRoute from '@/components/GuestRoute/GuestRoute.jsx';
import '@/components/ProtectedRoute/ProtectedRoute.css';
import GalleryPage from '@/pages/GalleryPage/GalleryPage.jsx';
import MyClubsPage from '@/pages/MyClubsPage/MyClubsPage.jsx';
import MyRegistrationsPage from '@/pages/MyRegistrationsPage/MyRegistrationsPage.jsx';
import CheckInPage from '@/pages/CheckInPage/CheckInPage.jsx';
import FinancePage from '@/pages/FinancePage/FinancePage.jsx';
import AdminDashboardPage from '@/pages/AdminDashboardPage/AdminDashboardPage.jsx';
import AdminUsersPage from '@/pages/AdminUsersPage/AdminUsersPage.jsx';
import AdminRolesPage from '@/pages/AdminRolesPage/AdminRolesPage.jsx';
import AdminClubsPage from '@/pages/AdminClubsPage/AdminClubsPage.jsx';
import AdminSettingsPage from '@/pages/AdminSettingsPage/AdminSettingsPage.jsx';
import ManagerDashboardPage from '@/pages/ManagerDashboardPage/ManagerDashboardPage.jsx';
import ManagerClubsPage from '@/pages/ManagerClubsPage/ManagerClubsPage.jsx';
import ManagerAnnouncementsPage from '@/pages/ManagerAnnouncementsPage/ManagerAnnouncementsPage.jsx';
import ManagerActivityLogPage from '@/pages/ManagerActivityLogPage/ManagerActivityLogPage.jsx';
import ManagerReviewPage from '@/pages/ManagerReviewPage/ManagerReviewPage.jsx';
import AlumniPage from '@/pages/Alumni/AlumniPage.jsx';
import NotificationsPage from '@/pages/Notifications/NotificationsPage.jsx';
import PaymentPage from '@/pages/Payment/PaymentPage.jsx';
import ReportsPage from '@/pages/Reports/ReportsPage.jsx';
import MentorDashboardPage from '@/pages/MentorDashboardPage/MentorDashboardPage.jsx';
import MentorClubsPage from '@/pages/MentorClubsPage/MentorClubsPage.jsx';
import MentorActivityLogPage from '@/pages/MentorActivityLogPage/MentorActivityLogPage.jsx';
import MentorReviewPage from '@/pages/MentorReviewPage/MentorReviewPage.jsx';
import LeaderDashboardPage from '@/pages/DashboardPage/LeaderDashboardPage.jsx';
import LeaderMembersPage from '@/pages/MembersPage/LeaderMembersPage.jsx';
import LeaderEventsPage from '@/pages/EventsPage/LeaderEventsPage.jsx';
import LeaderWorkshopsPage from '@/pages/WorkshopsPage/LeaderWorkshopsPage.jsx';
import LeaderAnnouncementsPage from '@/pages/AnnouncementsPage/LeaderAnnouncementsPage.jsx';
import LeaderDocumentsPage from '@/pages/DocumentsPage/LeaderDocumentsPage.jsx';
import LeaderKnowledgePage from '@/pages/KnowledgePage/LeaderKnowledgePage.jsx';
import LeaderFinancePage from '@/pages/FinancePage/LeaderFinancePage.jsx';
import MemberDashboardPage from '@/pages/MemberDashboardPage/MemberDashboardPage.jsx';
import MemberMyClubPage from '@/pages/MemberMyClubPage/MemberMyClubPage.jsx';
import MemberFinancePage from '@/pages/MemberFinancePage/MemberFinancePage.jsx';
import PaymentReturnPage from '@/pages/PaymentReturnPage/PaymentReturnPage.jsx';
import DashboardLayout from '@/layouts/DashboardLayout/DashboardLayout.jsx';
import PublicLayout from '@/layouts/PublicLayout/PublicLayout.jsx';
import { ROLES } from '@/auth/rolePermissions';
import { LeaderScopeProvider } from '@/contexts/LeaderScopeContext.jsx';
import { MemberScopeProvider } from '@/contexts/MemberScopeContext.jsx';

/* Role-based routing is layered as follows:

   Public (no auth) — wrapped in <PublicLayout> (top navbar + footer):
     /                                    -> HomePage
     /clubs                               -> ClubsPage
     /events                              -> EventsPage
     /ai                                  -> AIPage (shows "sign in to chat" landing
                                              when unauthenticated, otherwise chat)
     /announcements                       -> AnnouncementsPage
     /gallery                             -> GalleryPage
     /profile                             -> ProfilePage
     /settings                            -> SettingsPage
     /my-clubs, /my-registrations         -> user-scoped lists
     /check-in                            -> members check in
     /alumni                              -> AlumniPage
     /notifications                       -> NotificationsPage
     /payment                             -> PaymentPage

   Sidebar (DashboardLayout) — management dashboards:
     /club/:clubId/*                      -> Club Leader dashboard family
     /admin, /admin/users, /admin/roles   -> Administrator
     /manager                             -> Manager
     /reports                             -> Manager / Administrator

   Guest-only (signed-out):
     /login, /signup, /forgot-password, /reset-password

   Role-restricted areas use <ProtectedRoute requiredRole=...> and / or
   requiredPermission=... see Auth/rolePermissions.js for the full grant map. */

export default function App() {
  return (
    <ErrorBoundary>
      <ConnectionBanner />
      <Routes>
      {/* Club Leader dashboard — flat routes under /leader/*. Aggregates
          every club the current user leads into a single set of pages.
          The leader-specific data layer is provided by LeaderScopeProvider. */}
      <Route
        path="/leader/*"
        element={
          <ProtectedRoute requiredRole={ROLES.CLUB_LEADER}>
            <LeaderScopeProvider>
              <DashboardLayout />
            </LeaderScopeProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/leader/dashboard" replace />} />
        <Route path="dashboard" element={<LeaderDashboardPage />} />
        <Route path="members" element={<LeaderMembersPage />} />
        <Route path="events" element={<LeaderEventsPage />} />
        <Route path="workshops" element={<LeaderWorkshopsPage />} />
        <Route path="announcements" element={<LeaderAnnouncementsPage />} />
        <Route path="documents" element={<LeaderDocumentsPage />} />
        <Route path="knowledge" element={<LeaderKnowledgePage />} />
        <Route path="finance" element={<LeaderFinancePage />} />
        <Route path="*" element={<Navigate to="/leader/dashboard" replace />} />
      </Route>

      {/* Backward-compat redirect: the old per-club dashboard URLs now
          collapse to the leader dashboard. We strip the `:clubId` segment
          and map to the matching leader page when one exists, otherwise
          fall back to the dashboard. */}
      <Route
        path="/club/:clubId/*"
        element={<LegacyClubRedirect />}
      />

      {/* Admin & Manager dashboards — also use DashboardLayout with sidebar */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole={ROLES.ADMINISTRATOR}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="clubs" element={<AdminClubsPage />} />
        <Route path="roles" element={<AdminRolesPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route
        path="/manager/*"
        element={
          <ProtectedRoute requiredRole={ROLES.MANAGER}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerDashboardPage />} />
        <Route path="clubs" element={<ManagerClubsPage />} />
        <Route path="announcements" element={<ManagerAnnouncementsPage />} />
        <Route path="log" element={<ManagerActivityLogPage />} />
        <Route path="review" element={<ManagerReviewPage />} />
        <Route path="*" element={<Navigate to="/manager" replace />} />
      </Route>

      {/* Mentor Dashboard — read-only oversight of assigned clubs.
          Each Mentor page lives at its own URL but shares the same
          DashboardLayout + Mentor sidebar. */}
      <Route
        path="/mentor/*"
        element={
          <ProtectedRoute requiredRole={ROLES.MENTOR}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<MentorDashboardPage />} />
        <Route path="clubs" element={<MentorClubsPage />} />
        <Route path="log" element={<MentorActivityLogPage />} />
        <Route path="review" element={<MentorReviewPage />} />
        <Route path="*" element={<Navigate to="/mentor/dashboard" replace />} />
      </Route>

      {/* Club Member Dashboard — read-only view of the clubs the user
          belongs to (members/events/documents/knowledge) plus a fee
          tracker that consumes club_fee_settings.monthly_amount. */}
      <Route
        path="/member/*"
        element={
          <ProtectedRoute requiredRole={ROLES.CLUB_MEMBER}>
            <MemberScopeProvider>
              <DashboardLayout />
            </MemberScopeProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<MemberDashboardPage />} />
        <Route path="clubs" element={<MemberMyClubPage />} />
        <Route path="finance" element={<MemberFinancePage />} />
        <Route path="*" element={<Navigate to="/member" replace />} />
      </Route>

      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRole={[ROLES.MANAGER, ROLES.ADMINISTRATOR]}>
            <ReportsShell />
          </ProtectedRoute>
        }
      />

      {/* Public / portal pages — wrapped in <PublicLayout> (top navbar) */}
      <Route element={<PublicLayout />}>
        {/* Public (no auth) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/ai" element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
        <Route path="/alumni" element={<ProtectedRoute><AlumniPage /></ProtectedRoute>} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/announcements/:clubId" element={<AnnouncementsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />

        {/* Authenticated (any role) */}
        <Route path="/my-clubs" element={<ProtectedRoute><MyClubsPage /></ProtectedRoute>} />
        <Route path="/my-registrations" element={<ProtectedRoute><MyRegistrationsPage /></ProtectedRoute>} />
        <Route path="/check-in" element={<ProtectedRoute requiredRole={ROLES.CLUB_MEMBER}><CheckInPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute requiredRole={[ROLES.CLUB_MEMBER, ROLES.CLUB_LEADER]}><PaymentPage /></ProtectedRoute>} />
        <Route path="/payment/return" element={<PaymentReturnPage />} />
        <Route path="/finance" element={<ProtectedRoute requiredRole={[ROLES.CLUB_MEMBER, ROLES.CLUB_LEADER]}><FinancePage /></ProtectedRoute>} />
      </Route>

      {/* Guest-only — Auth flows (no layout) */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <SignUpPage />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

/* Backward-compat: legacy per-club URLs (/club/:clubId/dashboard,
   /club/:clubId/members, ...) collapse to the new flat leader routes.
   Strips the :clubId segment and maps the rest onto the leader area.
   Unknown subpaths land on /leader/dashboard so users always land on
   a real screen. */
function LegacyClubRedirect() {
  const { clubId } = useParams();
  const rest = window.location.pathname.replace(/^\/club\/[^/]+/, '').replace(/^\/+/, '');
  const map = {
    '': '/leader/dashboard',
    'dashboard': '/leader/dashboard',
    'members': '/leader/members',
    'events': '/leader/events',
    'workshops': '/leader/workshops',
    'knowledge': '/leader/knowledge',
    'documents': '/leader/documents',
    'announcements': '/leader/announcements',
    'finance': '/leader/finance',
  };
  const target = map[rest] || '/leader/dashboard';
  // eslint-disable-next-line no-console
  console.info(`[legacy] redirecting /club/${clubId}/${rest} → ${target}`);
  return <Navigate to={target} replace />;
}

/* Reports page lives under DashboardLayout (sidebar) for Manager/Admin. */
function ReportsShell() {
  return (
    <DashboardLayout>
      <ReportsPage />
    </DashboardLayout>
  );
}