import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { eventService } from '@/services/eventService'
import { Card, Button, Badge, Loading, toast, ConfirmModal } from '@/components'
import { useRegistration, registrationStore } from '@/stores/userStore'

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EventDetailPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [currentCount, setCurrentCount] = useState(0)
  const { registrations, isRegistered, register, cancel } = useRegistration()
  const registration = registrations.find((r) => r.eventId === id)
  const registered = isRegistered(id)

  useEffect(() => {
    loadEvent()
  }, [id])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const [data, count] = await Promise.all([
        eventService.getById(id),
        eventService.getRegistrationCount(id).catch(() => 0),
      ])
      setEvent(data)
      setCurrentCount(count)
    } catch (error) {
      console.error('Error loading event:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading fullScreen />

  if (!event) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-secondary-100 mb-4">Event not found</h1>
        <Link to="/events">
          <Button>Back to Events</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-64 md:h-80 bg-linear-to-br from-primary-700 to-primary-800">
        {(event.cover_image_url || event.banner_url) && (
          <img
            src={event.cover_image_url || event.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-primary-900 to-transparent" />
        <div className="container relative h-full flex items-end pb-8">
          <div>
            <Badge
              variant={event.status === 'upcoming' ? 'upcoming' : event.status}
              className="mb-4"
            >
              {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-100">
              {event.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-secondary-100 mb-4">About This Event</h2>
                  <p className="text-secondary-200 leading-relaxed whitespace-pre-wrap">
                    {event.description || 'No description available for this event.'}
                  </p>
                </div>
              </Card>

              {event.clubs && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-secondary-100 mb-4">Organized By</h2>
                    <Link
                      to={`/clubs/${event.clubs.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-primary-800/50 hover:bg-primary-800 transition-colors"
                    >
                      {event.clubs.logo_url && (
                        <img
                          src={event.clubs.logo_url}
                          alt={event.clubs.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-secondary-100">{event.clubs.name}</p>
                        <p className="text-sm text-secondary-300">View club page</p>
                      </div>
                    </Link>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-secondary-100">Event Details</h3>

                  {/* Date */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent-green/20">
                      <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-300">Date</p>
                      <p className="font-medium text-secondary-100">
                        {formatDate(event.start_time)}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent-green/20">
                      <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-300">Time</p>
                      <p className="font-medium text-secondary-100">
                        {formatTime(event.start_time)}
                        {event.end_time && ` - ${formatTime(event.end_time)}`}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accent-green/20">
                        <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-300">Location</p>
                        <p className="font-medium text-secondary-100">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Participants */}
                  {event.max_participants && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accent-green/20">
                        <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-300">Max Participants</p>
                        <p className="font-medium text-secondary-100">{event.max_participants}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {event.status === 'upcoming' && (
                <Card className="bg-linear-to-br from-primary-800 to-accent-green/20 border-accent-green/30">
                  <div className="p-6 text-center">
                    <h3 className="text-lg font-semibold text-secondary-100 mb-2">
                      {registered
                        ? registration?.status === 'checked_in'
                          ? "You're Checked In!"
                          : "You're Registered!"
                        : 'Interested in this event?'}
                    </h3>
                    <p className="text-sm text-secondary-200 mb-4">
                      {registered
                        ? 'Manage from My Registrations'
                        : 'Register now to secure your spot'}
                    </p>
                    {registered ? (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setConfirmCancel(true)}
                      >
                        {registration?.status === 'checked_in'
                          ? 'View QR Code'
                          : 'Cancel Registration'}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => {
                          register(event.id)
                          setCurrentCount((c) => c + 1)
                          toast(`Registered for ${event.title}!`, { variant: 'success' })
                        }}
                      >
                        Register Now
                      </Button>
                    )}
                    {event.max_participants && (
                      <p className="text-xs text-secondary-300 mt-3">
                        {currentCount} / {event.max_participants} registered
                      </p>
                    )}
                  </div>
                </Card>
              )}

              <Link to="/events">
                <Button variant="ghost" className="w-full">
                  ← Back to Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ConfirmModal
        open={confirmCancel}
        title="Cancel registration?"
        description="You can register again later if seats are still available."
        confirmLabel="Cancel Registration"
        variant="danger"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          cancel(event.id)
          setCurrentCount((c) => Math.max(0, c - 1))
          setConfirmCancel(false)
          toast('Registration cancelled', { variant: 'info' })
        }}
      />
    </div>
  )
}
