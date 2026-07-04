import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage/HomePage.jsx';
import ClubsPage from '@/pages/ClubsPage/ClubsPage.jsx';
import EventsPage from '@/pages/EventsPage/EventsPage.jsx';
import KnowledgePage from '@/pages/KnowledgePage/KnowledgePage.jsx';
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

import { GalleryPage } from '@/pages/GalleryPage'
import { MyClubsPage } from '@/pages/MyClubsPage'
import { MyRegistrationsPage } from '@/pages/MyRegistrationsPage'
import { CheckInPage } from '@/pages/CheckInPage'
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <Routes>
      {/* Club Layout nested routing */}
      <Route path="/club/:clubId/*" element={<AppRoutes />} />

      <Route path="/" element={<HomePage />} />
      <Route path="/clubs" element={<ClubsPage />} />
      <Route path="/clubs/:clubId" element={<ClubsPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:eventId" element={<EventsPage />} />
      <Route path="/knowledge" element={<KnowledgePage />} />
      <Route path="/knowledge/:articleId" element={<KnowledgePage />} />
      <Route path="/ai" element={<AIPage />} />
      <Route path="/announcements" element={<AnnouncementsPage />} />
      <Route path="/announcements/:announcementId" element={<AnnouncementsPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/my-clubs" element={<MyClubsPage />} />
      <Route path="/my-registrations" element={<MyRegistrationsPage />} />
      <Route path="/check-in" element={<CheckInPage />} />
      
      {/* Auth routes - only for guests */}
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
      
      {/* Protected routes */}
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
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}