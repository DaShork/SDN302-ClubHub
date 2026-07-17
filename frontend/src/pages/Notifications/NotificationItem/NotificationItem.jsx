import { Bell } from 'lucide-react';
import './NotificationItem.css';

const TYPE_META = {
  event: { label: 'Event', icon: '📅' },
  announcement: { label: 'Announcement', icon: '📣' },
  payment: { label: 'Payment', icon: '💳' },
  membership: { label: 'Membership', icon: '👥' },
  system: { label: 'System', icon: '⚙️' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
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
  const meta = TYPE_META[type] || TYPE_META.system;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`notif-item ${!is_read ? 'notif-item--unread' : ''}`}
      onClick={() => onRead?.(notification.id)}
      onKeyDown={(e) => e.key === 'Enter' && onRead?.(notification.id)}
    >
      <div className="notif-item__icon" aria-hidden="true">
        <span>{meta.icon}</span>
      </div>

      <div className="notif-item__body">
        <div className="notif-item__head">
          <h4 className="notif-item__title">{title}</h4>
          <span className="notif-item__time">{timeAgo(created_at)}</span>
        </div>
        {content && <p className="notif-item__content">{content}</p>}
        <div className="notif-item__meta">
          <span className={`notif-item__type notif-item__type--${type}`}>{meta.label}</span>
          {!is_read && <span className="notif-item__dot" aria-label="Unread" />}
        </div>
      </div>

      {onDelete && (
        <button
          className="notif-item__delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(notification.id);
          }}
          aria-label="Delete notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      )}
    </div>
  );
}