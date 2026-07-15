import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { eventService } from '@/services/eventService'
import { joinRequestService } from '@/services/joinRequestService'
import { resolveClubUuid } from '@/services/supabase'
import { Card, Button, Badge, Loading, toast, ConfirmModal, JoinRequestModal } from '@/components'
import { useAuth } from '@/hooks/useAuth.jsx'
import { Clock, CheckCircle, XCircle, Users } from 'lucide-react'
import './EventDetailPage.css';

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

export default function EventDetailPageContent() {
  const { id } = useParams()
  const { profileId, isAuthenticated } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [currentCount, setCurrentCount] = useState(0)
  const [registration, setRegistration] = useState(null)
  const [registering, setRegistering] = useState(false)
  const [registrationRequest, setRegistrationRequest] = useState(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  const loadEvent = async () => {
    try {
      setLoading(true)
      const [data, count] = await Promise.all([
        eventService.getById(id),
        eventService.getRegistrationCount(id).catch(() => 0),
      ])
      setEvent(data)
      setCurrentCount(count)

      if (profileId) {
        const [reg, request] = await Promise.all([
          eventService.isUserRegistered(id, profileId).catch(() => null),
          joinRequestService.getUserEventRequest(profileId, id).catch(() => null)
        ])
        setRegistration(reg)
        setRegistrationRequest(request)
      }
    } catch (error) {
      console.error('Error loading event:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvent()
  }, [id, profileId])

  const handleRegisterClick = () => {
    if (!profileId) {
      toast('Vui lòng đăng nhập để đăng ký', { variant: 'error' })
      return
    }
    // Check if there's a pending request
    if (registrationRequest?.status === 'pending') {
      toast('Bạn đã có yêu cầu đang chờ duyệt', { variant: 'warning' })
      return
    }
    setShowRegisterModal(true)
  }

  const handleSubmitRegistrationRequest = async (formData) => {
    if (!event?.id) {
      throw new Error('Missing event id');
    }
    // Resolve club UUID — the events table stores club_id as UUID, so
    // a slug here would cause the request to fail with 22P02.
    let clubIdForRequest = event?.club_id || event?.clubs?.id;
    if (clubIdForRequest && !/^[0-9a-f-]{36}$/i.test(clubIdForRequest)) {
      const resolved = await resolveClubUuid(clubIdForRequest);
      clubIdForRequest = resolved || clubIdForRequest;
    }
    try {
      await joinRequestService.submitEventRequest({
        eventId: event.id,
        clubId: clubIdForRequest,
        profileId,
        ...formData
      });
      toast('Đã gửi yêu cầu đăng ký sự kiện!', { variant: 'success' });
      // Refresh the request status
      const request = await joinRequestService.getUserEventRequest(profileId, event.id).catch(() => null);
      setRegistrationRequest(request);
      return true;
    } catch (err) {
      console.error('Submit registration request failed:', err);
      toast('Không thể gửi yêu cầu', { variant: 'error' });
      throw err;
    }
  }

  const handleCancelRequest = async () => {
    try {
      await eventService.cancelRegistrationByUser(id, profileId)
      setRegistration((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
      setCurrentCount((c) => Math.max(0, c - 1))
      setConfirmCancel(false)
      toast('Registration cancelled', { variant: 'info' })
    } catch (err) {
      console.error('Cancel registration failed:', err)
      toast('Không thể hủy đăng ký', { variant: 'error' })
    }
  }

  if (loading) return <Loading fullScreen />

  if (!event) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Event not found</h1>
        <Link to="/events">
          <Button>Back to Events</Button>
        </Link>
      </div>
    )
  }

  const registered = registration && registration.status !== 'cancelled'
  const checkedIn = registration?.status === 'checked_in'
  const requestStatus = registrationRequest?.status

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-64 md:h-80 event-detail-hero">
        {(event.cover_image_url || event.banner_url) && (
          <img
            src={event.cover_image_url || event.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 event-detail-hero-overlay" />
        <div className="container relative h-full flex items-end pb-8">
          <div>
            <Badge
              variant={event.status === 'upcoming' ? 'upcoming' : event.status}
              className="mb-4"
            >
              {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-900">
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
                  <h2 className="text-xl font-semibold text-primary-900 mb-4">About This Event</h2>
                  <p className="text-primary-800 leading-relaxed whitespace-pre-wrap">
                    {event.description || 'No description available for this event.'}
                  </p>
                </div>
              </Card>

              {event.clubs && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-primary-900 mb-4">Organized By</h2>
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
                        <p className="font-semibold text-primary-900">{event.clubs.name}</p>
                        <p className="text-sm text-primary-700">View club page</p>
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
                  <h3 className="text-lg font-semibold text-primary-900">Event Details</h3>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent-green/20">
                      <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-primary-700">Date</p>
                      <p className="font-medium text-primary-900">
                        {formatDate(event.start_time)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent-green/20">
                      <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-primary-700">Time</p>
                      <p className="font-medium text-primary-900">
                        {formatTime(event.start_time)}
                        {event.end_time && ` - ${formatTime(event.end_time)}`}
                      </p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accent-green/20">
                        <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-primary-700">Location</p>
                        <p className="font-medium text-primary-900">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.max_participants && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accent-green/20">
                        <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-primary-700">Max Participants</p>
                        <p className="font-medium text-primary-900">{event.max_participants}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {event.status === 'upcoming' && (
                <Card className="event-detail-cta">
                  <div className="p-6 text-center">
                    <h3 className="text-lg font-semibold text-primary-900 mb-2">
                      {checkedIn
                        ? "You're Checked In!"
                        : registered
                        ? "You're Registered!"
                        : requestStatus === 'pending'
                        ? "Request Pending"
                        : requestStatus === 'rejected'
                        ? "Request Rejected"
                        : 'Interested in this event?'}
                    </h3>
                    <p className="text-sm text-primary-800 mb-4">
                      {registered
                        ? 'Manage from My Registrations'
                        : requestStatus === 'pending'
                        ? 'Your registration request is being reviewed'
                        : requestStatus === 'rejected'
                        ? 'Your registration was not approved'
                        : 'Register now to secure your spot'}
                    </p>

                    {/* Registration status display */}
                    {requestStatus && !registered && (
                      <div className={`event-request-status event-request-status--${requestStatus}`}>
                        {requestStatus === 'pending' && (
                          <>
                            <Clock size={20} />
                            <span>Đang chờ duyệt</span>
                          </>
                        )}
                        {requestStatus === 'rejected' && (
                          <>
                            <XCircle size={20} />
                            <span>Bị từ chối</span>
                          </>
                        )}
                        {requestStatus === 'approved' && (
                          <>
                            <CheckCircle size={20} />
                            <span>Đã được duyệt</span>
                          </>
                        )}
                      </div>
                    )}

                    {registered ? (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setConfirmCancel(true)}
                      >
                        {checkedIn ? 'View QR Code' : 'Cancel Registration'}
                      </Button>
                    ) : requestStatus !== 'pending' && (
                      <Button
                        className="w-full"
                        onClick={handleRegisterClick}
                        disabled={registering || !isAuthenticated}
                      >
                        {registering ? 'Đang gửi...' : isAuthenticated ? 'Đăng ký ngay' : 'Đăng nhập để đăng ký'}
                      </Button>
                    )}

                    {event.max_participants && (
                      <div className="event-registration-stats">
                        <Users size={14} />
                        <span>{currentCount} / {event.max_participants} đã đăng ký</span>
                      </div>
                    )}
                    {registered && registration?.qr_code && (
                      <p className="text-xs text-primary-800 mt-3 font-mono">
                        {registration.qr_code}
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
        onConfirm={handleCancelRequest}
      />

      <JoinRequestModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSubmit={handleSubmitRegistrationRequest}
        type="event"
        title={event?.title}
        loading={registering}
      />
    </div>
  )
}