import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import { eventService } from '@/services/eventService';
import './UpcomingEvents.css';

function formatEventDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatEventTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await eventService.getFeatured(6);
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) {
          console.error('[UpcomingEvents] load error:', err);
          setError('Không thể tải sự kiện.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="upcoming-events">
        <div className="upcoming-events__inner">
          <div className="upcoming-events__loading">
            <Loader2 size={32} className="spin" />
            <span>Đang tải sự kiện...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="upcoming-events">
        <div className="upcoming-events__inner">
          <p className="upcoming-events__error">{error}</p>
        </div>
      </section>
    );
  }

  if (!events.length) {
    return (
      <section className="upcoming-events">
        <div className="upcoming-events__inner">
          <div className="upcoming-events__head">
            <div>
              <span className="upcoming-events__eyebrow">Upcoming Events</span>
              <h2 className="upcoming-events__title">Không có sự kiện nào sắp tới</h2>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="upcoming-events">
      <div className="upcoming-events__inner">
        <div className="upcoming-events__head">
          <div>
            <span className="upcoming-events__eyebrow">Sắp diễn ra</span>
            <h2 className="upcoming-events__title">Đừng bỏ lỡ</h2>
          </div>
          <Link to="/events" className="upcoming-events__view-all">
            Xem lịch đầy đủ →
          </Link>
        </div>

        <div className="upcoming-events__grid">
          {events.map((event) => (
            <article key={event.id} className="upcoming-events__card">
              {event.banner_url && (
                <div className="upcoming-events__banner">
                  <img src={event.banner_url} alt={event.title} loading="lazy" />
                </div>
              )}

              <div className="upcoming-events__card-top">
                <span className="upcoming-events__pill">Sắp diễn ra</span>
                {event.clubs && (
                  <span className="upcoming-events__club">{event.clubs.name}</span>
                )}
              </div>

              <h3 className="upcoming-events__card-title">{event.title}</h3>

              {event.description && (
                <p className="upcoming-events__desc">{event.description}</p>
              )}

              <div className="upcoming-events__meta">
                <div className="upcoming-events__meta-row">
                  <Calendar size={14} className="upcoming-events__meta-icon" />
                  <span>{formatEventDate(event.start_time)}</span>
                </div>
                {event.start_time && (
                  <div className="upcoming-events__meta-row">
                    <MapPin size={14} className="upcoming-events__meta-icon" />
                    <span>{event.location || 'Chưa có địa điểm'}</span>
                  </div>
                )}
                {event.registrationCount > 0 && (
                  <div className="upcoming-events__meta-row">
                    <Users size={14} className="upcoming-events__meta-icon" />
                    <span>{event.registrationCount} đã đăng ký</span>
                  </div>
                )}
              </div>

              <Link to={`/events/${event.id}`} className="upcoming-events__btn">
                Đăng ký ngay
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
