import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { eventService } from '@/services/eventService'
import { Card, Button, Badge, Loading, toast, ConfirmModal } from '@/components'
import { useRegistration } from '@/stores/userStore'

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

export function MyRegistrationsPage() {
  const { registrations, cancel } = useRegistration()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmCancel, setConfirmCancel] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [registrations.length])

  const loadEvents = async () => {
    if (registrations.length === 0) {
      setEvents([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const results = await Promise.all(
        registrations.map((r) =>
          eventService.getById(r.eventId).then((ev) => ({ ...ev, registration: r })).catch(() => null),
        ),
      )
      setEvents(results.filter(Boolean))
    } catch (error) {
      console.error('Error loading registrations:', error)
    } finally {
      setLoading(false)
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
    <div className="min-h-screen">
      <section className="gradient-primary py-12 md:py-16">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-accent-green text-sm font-semibold uppercase tracking-wider mb-2">
              My Dashboard
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-100 mb-2">
              My Registrations
            </h1>
            <p className="text-lg text-secondary-200">
              Events you've signed up for and their QR codes.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/5 mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-accent-green border-accent-green'
                    : 'text-secondary-300 border-transparent hover:text-secondary-100'
                }`}
              >
                {tab.label}
                {counts[tab.id] > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-primary-800">
                    {counts[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyTabState tab={activeTab} />
          ) : (
            <div className="space-y-4">
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
        onConfirm={() => {
          cancel(confirmCancel.id)
          toast('Registration cancelled', { variant: 'info' })
          setConfirmCancel(null)
        }}
      />
    </div>
  )
}

function RegistrationRow({ event, onCancel }) {
  const { title, cover_image_url, banner_url, start_time, location, clubs, registration } = event
  const checkedIn = registration.status === 'checked_in'

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-56 h-40 md:h-auto bg-linear-to-br from-primary-700 to-primary-800 relative shrink-0">
          {(cover_image_url || banner_url) ? (
            <img
              src={cover_image_url || banner_url}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {checkedIn && (
            <Badge variant="success" className="absolute top-3 left-3">
              ✓ Checked In
            </Badge>
          )}
        </div>
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <Link to={`/events/${event.id}`}>
              <h3 className="text-lg font-semibold text-secondary-100 hover:text-accent-green transition-colors mb-1">
                {title}
              </h3>
            </Link>
            {clubs && (
              <p className="text-sm text-secondary-300 mb-3">
                Organized by {clubs.name}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-secondary-300">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(start_time)}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(start_time)}
              </span>
              {location && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {location}
                </span>
              )}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-primary-800/60 border border-white/5">
              <p className="text-xs text-secondary-300 mb-1">Your QR Code</p>
              <p className="font-mono text-sm text-accent-green tracking-wider">
                {registration.qrCode}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <Link to={`/events/${event.id}`}>
              <Button size="sm" variant="secondary">View Event</Button>
            </Link>
            {!checkedIn && registration.status === 'registered' && (
              <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200" onClick={onCancel}>
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
    <div className="text-center py-16">
      <div className="mx-auto h-20 w-20 rounded-2xl bg-primary-800 flex items-center justify-center mb-6">
        <svg className="h-10 w-10 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-secondary-100 mb-2">{m.title}</h3>
      <p className="text-secondary-300 mb-6">{m.desc}</p>
      <Link to="/events">
        <Button>Browse Events</Button>
      </Link>
    </div>
  )
}
