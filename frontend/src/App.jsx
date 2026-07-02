import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage/HomePage.jsx';
import ClubsPage from '@/pages/ClubsPage/ClubsPage.jsx';
import EventsPage from '@/pages/EventsPage/EventsPage.jsx';
import KnowledgePage from '@/pages/KnowledgePage/KnowledgePage.jsx';
import AIPage from '@/pages/AIPage/AIPage.jsx';
import AnnouncementsPage from '@/pages/AnnouncementsPage/AnnouncementsPage.jsx';
import LoginPage from '@/pages/LoginPage/LoginPage.jsx';
import SignUpPage from '@/pages/SignUpPage/SignUpPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}