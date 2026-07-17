import { Bell, Trash2, Inbox, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { listNotifications, markAsRead, markAllAsRead, subscribeNotifications, deleteNotification } from '@/services/notificationService';
import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Loading, HeroSection } from '@/components';
import { NotificationItem } from './NotificationItem/NotificationItem.jsx';
import './NotificationsPage.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

export default function NotificationsPageContent() {
  const { profileId } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await listNotifications(profileId, {
      limit: 50,
      unreadOnly: filter === 'unread',
    });
    setNotifications(data || []);
    setUnreadCount((data || []).filter((n) => !n.is_read).length);
    setLoading(false);
  }, [profileId, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!profileId) return undefined;
    const unsub = subscribeNotifications(profileId, () => {
      fetchNotifications();
    }, 'page');
    return unsub;
  }, [profileId, fetchNotifications]);

  const handleRead = async (id) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAll = async () => {
    if (!profileId) return;
    await markAllAsRead(profileId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id) => {
    await deleteNotification(id).catch(() => null);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="notifications-page">
      <HeroSection
        variant="announcements"
        eyebrow="Notifications"
        title="Your"
        titleGradient="Notifications"
        subtitle="Stay up to date with everything happening across your clubs."
      />

      <section className="notifications-page__content">
        <div className="notifications-page__container">
          <Card className="notifications-page__panel">
            <div className="notifications-page__panel-head">
              <div className="notifications-page__filters" role="tablist">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    role="tab"
                    aria-selected={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={`notifications-page__filter ${filter === f.id ? 'notifications-page__filter--active' : ''}`}
                  >
                    {f.label}
                    {f.id === 'unread' && unreadCount > 0 && (
                      <span className="notifications-page__filter-count">{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAll}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </Button>
            </div>

            <div className="notifications-page__list">
              {loading ? (
                <div className="notifications-page__loading">
                  <Loading />
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState filter={filter} />
              ) : (
                notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={handleRead}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ filter }) {
  return (
    <div className="notifications-page__empty">
      <div className="notifications-page__empty-icon">
        {filter === 'unread' ? <Sparkles size={36} /> : <Inbox size={36} />}
      </div>
      <h3 className="notifications-page__empty-title">
        {filter === 'unread' ? "You're all caught up!" : 'No notifications yet'}
      </h3>
      <p className="notifications-page__empty-desc">
        {filter === 'unread'
          ? 'No unread notifications. Check back later for new updates.'
          : "When something happens in your clubs, you'll see it here."}
      </p>
    </div>
  );
}