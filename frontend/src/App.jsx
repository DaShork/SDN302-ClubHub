import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage/HomePage.jsx';
import ClubsPage from '@/pages/ClubsPage/ClubsPage.jsx';
import EventsPage from '@/pages/EventsPage/EventsPage.jsx';
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
import ManagerDashboardPage from '@/pages/ManagerDashboardPage/ManagerDashboardPage.jsx';
import AlumniPage from '@/pages/Alumni/AlumniPage.jsx';
import NotificationsPage from '@/pages/Notifications/NotificationsPage.jsx';
import PaymentPage from '@/pages/Payment/PaymentPage.jsx';
import ReportsPage from '@/pages/Reports/ReportsPage.jsx';
import DashboardLayout from '@/layouts/DashboardLayout/DashboardLayout.jsx';
import PublicLayout from '@/layouts/PublicLayout/PublicLayout.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import { ROLES } from '@/auth/rolePermissions';

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
    <Routes>
      {/* Nested club dashboards — wrapped in <DashboardLayout> with sidebar */}
      <Route path="/club/:clubId/*" element={<ClubDashboardShell />} />

      {/* Admin & Manager dashboards — also use DashboardLayout with sidebar */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={ROLES.ADMINISTRATOR}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="roles" element={<AdminRolesPage />} />
      </Route>

      <Route
        path="/manager"
        element={
          <ProtectedRoute requiredRole={ROLES.MANAGER}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerDashboardPage />} />
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
        <Route path="/clubs/:clubId" element={<ClubsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventsPage />} />
        <Route path="/ai" element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
        <Route path="/alumni" element={<ProtectedRoute><AlumniPage /></ProtectedRoute>} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/announcements/:announcementId" element={<AnnouncementsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />

        {/* Authenticated (any role) */}
        <Route path="/my-clubs" element={<ProtectedRoute><MyClubsPage /></ProtectedRoute>} />
        <Route path="/my-registrations" element={<ProtectedRoute><MyRegistrationsPage /></ProtectedRoute>} />
        <Route path="/check-in" element={<ProtectedRoute requiredRole={ROLES.CLUB_MEMBER}><CheckInPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute requiredRole={[ROLES.CLUB_MEMBER, ROLES.CLUB_LEADER]}><PaymentPage /></ProtectedRoute>} />
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
  );
}

/* Club dashboards: DashboardLayout wraps AppRoutes which renders the
   individual club pages. Pages inside this group render through <Outlet />. */
function ClubDashboardShell() {
  return (
    <ProtectedRoute requiredRole={ROLES.CLUB_LEADER}>
      <DashboardLayout />
    </ProtectedRoute>
  );
}

/* Reports page lives under DashboardLayout (sidebar) for Manager/Admin. */
function ReportsShell() {
  return (
    <DashboardLayout>
      <ReportsPage />
    </DashboardLayout>
  );
}