import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, MapPin, Ticket, Compass, CheckCircle2 } from 'lucide-react'
import { eventService } from '@/services/eventService'
import { Card, Button, Badge, Loading, toast, ConfirmModal, HeroSection } from '@/components'
import { useAuth } from '@/hooks/useAuth.jsx'
import './MyRegistrationsPage.css'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function MyRegistrationsPageContent() {
  const { profileId, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmCancel, setConfirmCancel] = useState(null)

  const loadRegistrations = async () => {
    if (!profileId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const rows = await eventService.getUserRegistrations(profileId).catch(() => [])
      const enriched = rows
        .filter((r) => r.events)
        .map((r) => ({ ...r.events, registration: r }))
      setEvents(enriched)
    } catch (error) {
      console.error('Error loading registrations:', error)
      toast('Không thể tải danh sách đăng ký', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    loadRegistrations()
  }, [profileId])

  const handleCancel = async (event) => {
    try {
      await eventService.cancelRegistrationByUser(event.id, profileId)
      toast('Registration cancelled', { variant: 'info' })
      setConfirmCancel(null)
      loadRegistrations()
    } catch (err) {
      console.error('Cancel registration failed:', err)
      toast('Không thể hủy đăng ký', { variant: 'error' })
    }
  }

  const now = new Date()
  const filtered = events.filter(({ registration: r, start_time }) => {
    if (activeTab === 'cancelled') return r.status === 'cancelled'
    if (r.status === 'cancelled') return false
    if (activeTab === 'upcoming') return new Date(start_time) >= now
    return new Date(start_time) < now
  })

  const counts = {
    upcoming: events.filter((e) => e.registration.status !== 'cancelled' && new Date(e.start_time) >= now).length,
    past: events.filter((e) => e.registration.status !== 'cancelled' && new Date(e.start_time) < now).length,
    cancelled: events.filter((e) => e.registration.status === 'cancelled').length,
  }

  return (
    <div className="my-reg-page">
      <HeroSection
        variant="myregistrations"
        eyebrow="My Dashboard"
        title="My"
        titleGradient="Registrations"
        subtitle="Events you've signed up for and their QR codes."
      />

      <section className="my-reg-page__content">
        <div className="my-reg-page__container">
          <div className="my-reg-page__tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`my-reg-page__tab ${activeTab === tab.id ? 'my-reg-page__tab--active' : ''}`}
              >
                {tab.label}
                {counts[tab.id] > 0 && (
                  <span className="my-reg-page__tab-count">{counts[tab.id]}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyTabState tab={activeTab} />
          ) : (
            <div className="my-reg-page__list">
              {filtered.map((event) => (
                <RegistrationRow
                  key={event.id}
                  event={event}
                  onCancel={() => setConfirmCancel(event)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        open={!!confirmCancel}
        title="Cancel registration?"
        description={`Cancel your spot for "${confirmCancel?.title}"?`}
        confirmLabel="Cancel Registration"
        variant="danger"
        onCancel={() => setConfirmCancel(null)}
        onConfirm={() => handleCancel(confirmCancel)}
      />
    </div>
  )
}

function RegistrationRow({ event, onCancel }) {
  const { title, cover_image_url, banner_url, start_time, location, clubs, registration } = event
  const checkedIn = registration.status === 'checked_in'

  return (
    <Card className="my-reg-row">
      <div className="my-reg-row__layout">
        <div className="my-reg-row__banner">
          {(cover_image_url || banner_url) ? (
            <img
              src={cover_image_url || banner_url}
              alt={title}
              className="my-reg-row__banner-img"
            />
          ) : (
            <div className="my-reg-row__banner-placeholder">
              <CalendarDays size={48} />
            </div>
          )}
          {checkedIn && (
            <Badge variant="success" className="my-reg-row__checked-badge">
              <CheckCircle2 size={12} /> Checked In
            </Badge>
          )}
        </div>
        <div className="my-reg-row__body">
          <div>
            <Link to={`/events/${event.id}`}>
              <h3 className="my-reg-row__title">{title}</h3>
            </Link>
            {clubs && (
              <p className="my-reg-row__organizer">Organized by {clubs.name}</p>
            )}
            <div className="my-reg-row__meta">
              <span className="my-reg-row__meta-item">
                <CalendarDays size={16} />
                {formatDate(start_time)}
              </span>
              <span className="my-reg-row__meta-item">
                <Clock size={16} />
                {formatTime(start_time)}
              </span>
              {location && (
                <span className="my-reg-row__meta-item">
                  <MapPin size={16} />
                  {location}
                </span>
              )}
            </div>
            <div className="my-reg-row__qr">
              <p className="my-reg-row__qr-label">
                <Ticket size={12} /> Your QR Code
              </p>
              <p className="my-reg-row__qr-code">{registration.qr_code}</p>
            </div>
          </div>
          <div className="my-reg-row__actions">
            <Link to={`/events/${event.id}`}>
              <Button size="sm" variant="secondary">View Event</Button>
            </Link>
            {!checkedIn && registration.status === 'registered' && (
              <Button
                size="sm"
                variant="ghost"
                className="my-reg-row__cancel"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyTabState({ tab }) {
  const messages = {
    upcoming: {
      title: 'No upcoming registrations',
      desc: 'Events you register for will appear here.',
    },
    past: {
      title: 'No past registrations',
      desc: 'Events you attended will be listed here after they finish.',
    },
    cancelled: {
      title: 'No cancelled registrations',
      desc: 'Registrations you cancel will be kept here for 30 days.',
    },
  }
  const m = messages[tab] || messages.upcoming
  return (
    <div className="my-reg-empty">
      <div className="my-reg-empty__icon">
        <Compass size={40} />
      </div>
      <h3 className="my-reg-empty__title">{m.title}</h3>
      <p className="my-reg-empty__desc">{m.desc}</p>
      <Link to="/events">
        <Button>Browse Events</Button>
      </Link>
    </div>
  )
}