import { Badge } from '../../../components/shared/Badge';

const TYPE_ICONS = {
  event: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  announcement: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6zM6 17V7a6 6 0 0112 0v10"/>
    </svg>
  ),
  payment: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  membership: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  system: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationItem({ notification, onRead, onDelete }) {
  const { title, content, type = 'system', is_read, created_at } = notification;
  const Icon = TYPE_ICONS[type] || TYPE_ICONS.system;

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:bg-primary-800 ${
        !is_read ? 'border-accent-green/30' : ''
      }`}
      style={{
        backgroundColor: is_read ? 'rgba(255,255,255,0.02)' : 'rgba(34,197,94,0.05)',
        borderColor: is_read ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.3)',
      }}
      onClick={() => onRead?.(notification.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onRead?.(notification.id)}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
        {Icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-secondary-100">{title}</h4>
          <span className="text-xs shrink-0" style={{ color: 'rgba(244,241,234,0.3)' }}>
            {timeAgo(created_at)}
          </span>
        </div>
        {content && (
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'rgba(244,241,234,0.5)' }}>
            {content}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={type === 'event' ? 'upcoming' : type === 'payment' ? 'pending' : type}>{type}</Badge>
          {!is_read && (
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
          )}
        </div>
      </div>

      {/* Actions */}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(notification.id); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary-200 hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
          aria-label="Delete notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      )}
    </div>
  );
}
