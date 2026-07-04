import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout/MainLayout";
import DashboardPage from "../pages/DashboardPage/DashboardPage";
import MembersPage from "../pages/MembersPage/MembersPage";
import EventsPage from "../pages/EventsPage/EventsPage";
import WorkshopsPage from "../pages/WorkshopsPage/WorkshopsPage";
import KnowledgePage from "../pages/KnowledgePage/KnowledgePage";
import DocumentsPage from "../pages/DocumentsPage/DocumentsPage";
import AnnouncementsPage from "../pages/AnnouncementsPage/AnnouncementsPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Redirect base URL directly to F-Code club dashboard */}
      <Route path="/" element={<Navigate to="/club/f-code/dashboard" replace />} />

      {/* Club Layout nested routing */}
      <Route path="/club/:clubId" element={<MainLayout />}>
        {/* Redirect /club/:clubId to /club/:clubId/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="workshops" element={<WorkshopsPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />

        {/* Catch-all for invalid subroutes within a club */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Catch-all redirect to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
