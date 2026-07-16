import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Users, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { joinRequestService } from '@/services/joinRequestService';
import { eventService } from '@/services/eventService';
import './EventDetailModal.css';

export default function EventDetailModal({
  isOpen,
  onClose,
  activity,
  clubId,
}) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (!isOpen || !activity) return;
    loadData();
  }, [isOpen, activity]);

  async function loadData() {
    setLoading(true);
    try {
      const [statsData, requestsData] = await Promise.all([
        joinRequestService.getEventRequestStats(activity.id).catch(() => ({
          total: 0, pending: 0, approved: 0, rejected: 0,
        })),
        joinRequestService.getEventRequests(activity.id).catch(() => []),
      ]);
      setStats(statsData);
      setRequests(requestsData);
    } catch (err) {
      console.error('Failed to load event detail:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !activity) return null;

  const maxSlots = activity.maxSlots || activity.max_participants || 0;
  const registered = stats.approved || 0;
  const remaining = maxSlots ? Math.max(0, maxSlots - registered) : null;
  const isFull = maxSlots && remaining <= 0;

  const statusConfig = {
    approved: { label: 'Đã duyệt', className: 'event-detail-modal__status--approved' },
    pending: { label: 'Đang chờ', className: 'event-detail-modal__status--pending' },
    rejected: { label: 'Từ chối', className: 'event-detail-modal__status--rejected' },
  };

  return (
    <div className="event-detail-modal">
      <div className="event-detail-modal__backdrop" onClick={onClose} />

      <div className="event-detail-modal__panel">
        <button type="button" className="event-detail-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="event-detail-modal__header">
          <div className="event-detail-modal__type-badge">
            {activity.type}
          </div>
          <h2 className="event-detail-modal__title">{activity.title}</h2>
          {activity.clubName && (
            <p className="event-detail-modal__club">{activity.clubName}</p>
          )}
        </div>

        {/* Event Info */}
        <div className="event-detail-modal__info-grid">
          {activity.startTime && (
            <div className="event-detail-modal__info-item">
              <Calendar size={16} />
              <span>{new Date(activity.startTime).toLocaleDateString('vi-VN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}</span>
            </div>
          )}
          {activity.startTime && (
            <div className="event-detail-modal__info-item">
              <Clock size={16} />
              <span>{new Date(activity.startTime).toLocaleTimeString('vi-VN', {
                hour: '2-digit', minute: '2-digit'
              })}</span>
            </div>
          )}
          {activity.location && (
            <div className="event-detail-modal__info-item">
              <MapPin size={16} />
              <span>{activity.location}</span>
            </div>
          )}
          <div className="event-detail-modal__info-item">
            <Users size={16} />
            <span>
              {loading ? 'Đang tải...' : (
                maxSlots ? `${registered} / ${maxSlots} đã đăng ký` : `${registered} đã đăng ký`
              )}
            </span>
          </div>
        </div>

        {/* Capacity Warning */}
        {maxSlots > 0 && (
          <div className={`event-detail-modal__capacity ${isFull ? 'event-detail-modal__capacity--full' : ''}`}>
            {isFull ? (
              <>
                <AlertCircle size={16} />
                <span>Sự kiện đã đầy ({registered}/{maxSlots})</span>
              </>
            ) : (
              <>
                <UserCheck size={16} />
                <span>Còn {remaining} slot trống</span>
              </>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="event-detail-modal__stats">
          <div className="event-detail-modal__stat">
            <span className="event-detail-modal__stat-value">{stats.total}</span>
            <span className="event-detail-modal__stat-label">Tổng đăng ký</span>
          </div>
          <div className="event-detail-modal__stat event-detail-modal__stat--pending">
            <span className="event-detail-modal__stat-value">{stats.pending}</span>
            <span className="event-detail-modal__stat-label">Đang chờ</span>
          </div>
          <div className="event-detail-modal__stat event-detail-modal__stat--approved">
            <span className="event-detail-modal__stat-value">{stats.approved}</span>
            <span className="event-detail-modal__stat-label">Đã duyệt</span>
          </div>
          <div className="event-detail-modal__stat event-detail-modal__stat--rejected">
            <span className="event-detail-modal__stat-value">{stats.rejected}</span>
            <span className="event-detail-modal__stat-label">Từ chối</span>
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <div className="event-detail-modal__section">
            <h3 className="event-detail-modal__section-title">Mô tả</h3>
            <p className="event-detail-modal__description">{activity.description}</p>
          </div>
        )}

        {/* Registrations List */}
        <div className="event-detail-modal__section">
          <h3 className="event-detail-modal__section-title">Danh sách đăng ký</h3>

          {loading ? (
            <div className="event-detail-modal__loading">
              <div className="event-detail-modal__spinner" />
              <span>Đang tải danh sách...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="event-detail-modal__empty">
              Chưa có ai đăng ký sự kiện này.
            </div>
          ) : (
            <div className="event-detail-modal__list">
              {requests.map((req) => {
                const cfg = statusConfig[req.status] || statusConfig.pending;
                return (
                  <div key={req.id} className="event-detail-modal__row">
                    <div className="event-detail-modal__row-info">
                      <div className="event-detail-modal__row-avatar">
                        {req.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="event-detail-modal__row-name">
                          {req.full_name || req.profiles?.full_name || 'Không tên'}
                        </p>
                        <p className="event-detail-modal__row-meta">
                          {req.student_code || req.profiles?.student_code || ''}
                          {req.email && ` · ${req.email}`}
                        </p>
                      </div>
                    </div>
                    <span className={`event-detail-modal__status ${cfg.className}`}>
                      {req.status === 'approved' && <UserCheck size={12} />}
                      {req.status === 'pending' && <Clock size={12} />}
                      {req.status === 'rejected' && <UserX size={12} />}
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
