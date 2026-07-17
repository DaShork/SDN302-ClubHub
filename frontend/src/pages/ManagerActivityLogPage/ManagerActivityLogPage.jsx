import ActivityLogView from '@/components/ActivityLogView/ActivityLogView.jsx';

/* Manager activity log — every audit_log entry visible to a Manager.
 * Passes `filterClubIds = null` so the underlying view doesn't restrict by
 * club scope. Passes `allowedTables = null` so we don't filter tables; the
 * viewer still shows table tags to the user. */
export default function ManagerActivityLogPage() {
  return (
    <ActivityLogView
      title="Nhật ký hoạt động"
      subtitle="Theo dõi mọi thay đổi trên CLB, thành viên, sự kiện và thông báo."
      filterClubIds={null}
      allowedTables={null}
      limit={200}
    />
  );
}
