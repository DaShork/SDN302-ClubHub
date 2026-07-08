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
import AppRoutes from './routes/AppRoutes.jsx';
import { ROLES } from '@/auth/rolePermissions';

/* Role-based routing is layered as follows:

   Public (no auth):
     /                                    -> HomePage
     /clubs                               -> ClubsPage
     /events                              -> EventsPage
     /ai                                  -> AIPage
     /announcements                       -> AnnouncementsPage
     /gallery                             -> GalleryPage

   Auth (must be signed in, any role):
     /profile                             -> every authenticated user has a profile
     /settings                            -> settings belong to the user themselves
     /my-clubs                            -> "my" scoped lists belong to the user
     /my-registrations                    -> ditto
     /check-in                            -> members check in to their events

   Auth-restricted by role:
     /club/:clubId/*                     -> Club Leader dashboard family (Knowledge, Events,
                                              Workshops, Members, Documents, Announcements,
                                              Dashboard — see AppRoutes)

   Guest-only (signed-out):
     /login, /signup, /forgot-password, /reset-password

   Role-restricted areas use <ProtectedRoute requiredRole=...> and / or
   requiredPermission=... see Auth/rolePermissions.js for the full grant map. */

export default function App() {
  return (
    <Routes>
      {/* Nested club dashboards — Club Leader only (route-level guard). */}
      <Route path="/club/:clubId/*" element={<AppRoutes />} />

      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/clubs" element={<ClubsPage />} />
      <Route path="/clubs/:clubId" element={<ClubsPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:eventId" element={<EventsPage />} />
      <Route path="/ai" element={<AIPage />} />
      <Route path="/announcements" element={<AnnouncementsPage />} />
      <Route path="/announcements/:announcementId" element={<AnnouncementsPage />} />
      <Route path="/gallery" element={<GalleryPage />} />

      {/* Authenticated (any role) */}
      <Route
        path="/my-clubs"
        element={
          <ProtectedRoute>
            <MyClubsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-registrations"
        element={
          <ProtectedRoute>
            <MyRegistrationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/check-in"
        element={
          <ProtectedRoute requiredRole={ROLES.CLUB_MEMBER}>
            <CheckInPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Finance — Club Member + Club Leader */}
      <Route
        path="/finance"
        element={
          <ProtectedRoute requiredRole={[ROLES.CLUB_MEMBER, ROLES.CLUB_LEADER]}>
            <FinancePage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes — Administrator only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={ROLES.ADMINISTRATOR}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole={ROLES.ADMINISTRATOR}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute requiredRole={ROLES.ADMINISTRATOR}>
            <AdminRolesPage />
          </ProtectedRoute>
        }
      />

      {/* Manager routes — Manager only */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute requiredRole={ROLES.MANAGER}>
            <ManagerDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Guest-only — Auth flows */}
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
