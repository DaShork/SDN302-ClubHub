import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listNotifications, markAsRead, markAllAsRead, subscribeNotifications } from '../../services/notificationService';
import { NotificationItem } from './components/NotificationItem';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { Button } from '../../components/shared/Button';
import { EmptyState } from '../../components/shared/EmptyState';
import { Loader } from '../../components/shared/Loader';

export default function NotificationsPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await listNotifications(profile.id, {
      limit: 50,
      unreadOnly: filter === 'unread',
    });
    setNotifications(data || []);
    setUnreadCount((data || []).filter((n) => !n.is_read).length);
    setLoading(false);
  }, [profile?.id, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = subscribeNotifications(profile.id, () => {
      fetchNotifications();
    });
    return unsub;
  }, [profile?.id, fetchNotifications]);

  const handleRead = async (id) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAll = async () => {
    if (!profile?.id) return;
    await markAllAsRead(profile.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id) => {
    const notif = notifications.find((n) => n.id === id);
    await markAsRead(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notif && !notif.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-8">
      <SectionHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        actions={
          unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleMarkAll}>
              Mark all as read
            </Button>
          )
        }
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { value: 'all', label: `All (${notifications.length})` },
          { value: 'unread', label: `Unread (${unreadCount})` },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className="px-4 py-2 rounded-button text-sm font-medium transition-all"
            style={
              filter === value
                ? { background: 'linear-gradient(90deg, #0E4B43, #22C55E)', color: '#fff' }
                : { backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(244,241,234,0.5)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          }
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description={
            filter === 'unread'
              ? "You're all caught up! Check back later for new updates."
              : "You'll see notifications here when there are updates from clubs, events, and announcements."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
