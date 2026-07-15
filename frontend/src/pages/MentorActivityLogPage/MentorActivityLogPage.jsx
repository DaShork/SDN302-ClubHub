import ActivityLogView from '@/components/ActivityLogView/ActivityLogView.jsx';
import { useMentoredClubIds } from '@/hooks/useMentoredClubIds';

/* Mentor activity log — only entries whose target is one of the clubs
 * the current user mentors.
 *
 * Server-side RLS (migration 016) also enforces this scope, but we
 * pass `filterClubIds` so the underlying view restricts the query
 * cleanly and shows a clear "scope" to the user.
 */
export default function MentorActivityLogPage() {
  const { ids: clubs } = useMentoredClubIds();
  const ids = clubs.map((c) => c.id);

  if (ids.length === 0 && clubs.length === 0) {
    return (
      <ActivityLogView
        title="Nhật ký hoạt động"
        subtitle="Bạn chưa được phân công làm mentor cho CLB nào."
        filterClubIds={[]}
        allowedTables={['clubs', 'memberships', 'events', 'announcements', 'documents', 'payments']}
      />
    );
  }

  return (
    <ActivityLogView
      title="Nhật ký hoạt động"
      subtitle={`Hoạt động gần đây của ${ids.length} CLB bạn đang hỗ trợ.`}
      filterClubIds={ids}
      allowedTables={['clubs', 'memberships', 'events', 'announcements', 'documents', 'payments']}
      limit={150}
    />
  );
}
