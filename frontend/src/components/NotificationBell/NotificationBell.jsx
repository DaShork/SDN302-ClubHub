import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';
import {
  getUnreadCount,
  getRecentNotifications,
  markAsRead,
  subscribeNotifications,
} from '@/services/notificationService';
import './NotificationBell.css';

const TYPE_META = {
  event: { icon: '📅' },
  announcement: { icon: '📣' },
  payment: { icon: '💳' },
  membership: { icon: '👥' },
  system: { icon: '⚙️' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins}m trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
}

/* NotificationBell — bell icon with unread badge + dropdown popover.
 *
 * Renders in the Navbar. Shows:
 *   - Bell icon
 *   - Red badge with unread count (hides when 0)
 *   - Click → dropdown with 5 most recent notifications
 *   - Each item: click marks as read + navigates to link_url
 *   - "Xem tất cả" → navigates to /notifications
 *   - Click outside → closes dropdown
 */
export default function NotificationBell() {
  const { profileId } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // Load unread count and recent notifications
  async function load() {
    if (!profileId) return;
    const [countResult, recentResult] = await Promise.all([
      getUnreadCount(profileId),
      getRecentNotifications(profileId),
    ]);
    setUnread(countResult.count ?? 0);
    setRecent(recentResult.data ?? []);
  }

  useEffect(() => {
    if (!profileId) return;
    load();
    const unsub = subscribeNotifications(profileId, () => { load(); }, 'bell');
    return unsub;
  }, [profileId]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function handleNotifClick(notif) {
    // Mark as read
    if (!notif.is_read) {
      await markAsRead(notif.id);
      setUnread((n) => Math.max(0, n - 1));
      setRecent((list) =>
        list.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    // Navigate if link exists
    if (notif.link_url) {
      navigate(notif.link_url);
    }
    setOpen(false);
  }

  if (!profileId) return null;

  return (
    <div className="notif-bell" ref={ref}>
      <button
        className="notif-bell__btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Thông báo${unread > 0 ? ` (${unread} chưa đọc)` : ''}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="notif-bell__badge" aria-hidden="true">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-bell__popover">
          <div className="notif-bell__header">
            <span className="notif-bell__title">Thông báo</span>
            {unread > 0 && (
              <span className="notif-bell__unread-tag">{unread} chưa đọc</span>
            )}
          </div>

          <div className="notif-bell__list">
            {loading ? (
              <div className="notif-bell__loading">
                <div className="notif-bell__spinner" />
              </div>
            ) : recent.length === 0 ? (
              <div className="notif-bell__empty">
                <Bell size={24} />
                <p>Không có thông báo nào.</p>
              </div>
            ) : (
              recent.map((notif) => {
                const meta = TYPE_META[notif.type] || TYPE_META.system;
                return (
                  <div
                    key={notif.id}
                    className={`notif-bell__item ${!notif.is_read ? 'notif-bell__item--unread' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotifClick(notif)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNotifClick(notif)}
                  >
                    <span className="notif-bell__item-icon">{meta.icon}</span>
                    <div className="notif-bell__item-body">
                      <div className="notif-bell__item-row">
                        <span className="notif-bell__item-title">{notif.title}</span>
                        <span className="notif-bell__item-time">{timeAgo(notif.created_at)}</span>
                      </div>
                      {notif.content && (
                        <p className="notif-bell__item-content">{notif.content}</p>
                      )}
                    </div>
                    {!notif.is_read && <span className="notif-bell__item-dot" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="notif-bell__footer">
            <button
              className="notif-bell__view-all"
              onClick={() => { navigate('/notifications'); setOpen(false); }}
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}