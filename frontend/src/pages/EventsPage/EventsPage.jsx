import { Calendar } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { PagePlaceholder } from '@/components';

export default function EventsPage() {
  return (
    <MainLayout>
      <PagePlaceholder
        icon={Calendar}
        eyebrow="Events"
        title="Upcoming Events"
        description="Discover workshops, competitions, and campus activities organized by student clubs."
        features={[
          { icon: '🎟️', title: 'Event Registration', desc: 'Register for events with one tap.', bg: '#E8F5F0' },
          { icon: '📱', title: 'QR Check-in', desc: 'Quick check-in at the venue via QR code.', bg: '#EFF6FF' },
          { icon: '📅', title: 'Calendar View', desc: 'See all upcoming events in one place.', bg: '#F5F3FF' },
          { icon: '🏆', title: 'Competitions', desc: 'Hackathons, tournaments, pitch contests.', bg: '#FFFBEB' },
          { icon: '👥', title: 'Attendee Tracking', desc: 'Club leaders manage registration lists.', bg: '#FEF2F2' },
          { icon: '📊', title: 'Event Reports', desc: 'Post-event analytics and reflections.', bg: '#F0FDF4' },
        ]}
      />
    </MainLayout>
  );
}