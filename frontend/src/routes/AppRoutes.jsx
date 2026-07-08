import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute.jsx';
import { ROLES } from '@/auth/rolePermissions';
import KnowledgePage from '@/pages/KnowledgePage/KnowledgePage.jsx';
import MembersPage from '@/pages/MembersPage/MembersPage.jsx';
import EventsPage from '@/pages/EventsPage/EventsPage.jsx';
import WorkshopsPage from '@/pages/WorkshopsPage/WorkshopsPage.jsx';
import AnnouncementsPage from '@/pages/AnnouncementsPage/AnnouncementsPage.jsx';
import DocumentsPage from '@/pages/DocumentsPage/DocumentsPage.jsx';
import DashboardPage from '@/pages/DashboardPage/DashboardPage.jsx';

/* Nested routing under /club/:clubId/*. Each subroute is restricted to
   Club Leader per AGENTS.md §5. Pages at /club/:clubId/knowledge|events|...
   receive their clubId from useParams() inside each page component.

   NOTE: Pages inside this group (KnowledgePage, EventsPage, etc.) already
   wrap themselves in <MainLayout>. Do NOT add another MainLayout here. */

export default function AppRoutes() {
  return (
    <Routes>
      {/* Redirect base URL directly to F-Code club dashboard */}
      <Route path="/" element={<Navigate to="/club/f-code/dashboard" replace />} />

      <Route
        path="/club/:clubId"
        element={<Navigate to="dashboard" replace />}
      />

      <Route
        path="dashboard"
        element={
          <ProtectedRoute requiredRole={ROLES.CLUB_LEADER}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="members"
        element={
          <ProtectedRoute requiredRole={ROLES.CLUB_LEADER}>
            <MembersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="events"
        element={
          <ProtectedRoute requiredRole={ROLES.CLUB_LEADER}>
            <EventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="workshops"
        element={
          <ProtectedRoute requiredRole={ROLES.CLUB_LEADER}>
            <WorkshopsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="knowledge"
        element={
          <ProtectedRoute requiredRole={ROLES.CLUB_LEADER}>
            <KnowledgePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="documents"
        element={
          <ProtectedRoute requiredRole={ROLES.CLUB_LEADER}>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="announcements"
        element={
          <ProtectedRoute requiredRole={ROLES.CLUB_LEADER}>
            <AnnouncementsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all for invalid subroutes within a club */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
