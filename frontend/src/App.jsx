import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { HomePage } from '@/pages/HomePage'
import { ClubListPage } from '@/pages/ClubListPage'
import { ClubDetailPage } from '@/pages/ClubDetailPage'
import { EventListPage } from '@/pages/EventListPage'
import { EventDetailPage } from '@/pages/EventDetailPage'
import { GalleryPage } from '@/pages/GalleryPage'
import { MyClubsPage } from '@/pages/MyClubsPage'
import { MyRegistrationsPage } from '@/pages/MyRegistrationsPage'
import { CheckInPage } from '@/pages/CheckInPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/clubs" element={<ClubListPage />} />
          <Route path="/clubs/:id" element={<ClubDetailPage />} />
          <Route path="/events" element={<EventListPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/my-clubs" element={<MyClubsPage />} />
          <Route path="/my-registrations" element={<MyRegistrationsPage />} />
          <Route path="/check-in" element={<CheckInPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
