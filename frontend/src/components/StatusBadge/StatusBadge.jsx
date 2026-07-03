const STATUS_STYLES = {
  Recruiting: { background: '#E8F5F0', color: '#16685D', border: '1px solid rgba(22, 104, 93, 0.20)' },
  Active: { background: '#EFF6FF', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.20)' },
  Upcoming: { background: '#FFFBEB', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.20)' },
  Inactive: { background: '#F4F1EA', color: '#8A8270', border: '1px solid rgba(6, 35, 29, 0.10)' },
  Urgent: { background: '#FEF2F2', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.20)' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.Inactive;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={style}
    >
      {status}
    </span>
  );
}