import { Bell } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { PagePlaceholder } from '@/components';

export default function AnnouncementsPage() {
  return (
    <MainLayout>
      <PagePlaceholder
        icon={Bell}
        eyebrow="Announcements"
        title="Latest Updates"
        description="Stay up to date with IC-PDP and club announcements across FPT University."
        features={[
          { icon: '📣', title: 'IC-PDP Broadcasts', desc: 'Official announcements from the university.', bg: '#FFFBEB' },
          { icon: '🚨', title: 'Urgent Notices', desc: 'Pin critical deadlines and updates.', bg: '#FEF2F2' },
          { icon: '🏷️', title: 'Tagged by Club', desc: 'Filter announcements by club or topic.', bg: '#E8F5F0' },
          { icon: '📌', title: 'Pin Important', desc: 'Bookmark announcements for later.', bg: '#EFF6FF' },
          { icon: '🔔', title: 'Push Notifications', desc: 'Get notified on new announcements.', bg: '#F5F3FF' },
          { icon: '📊', title: 'Read Receipts', desc: 'Club leaders track who has seen posts.', bg: '#F0FDF4' },
        ]}
      />
    </MainLayout>
  );
}