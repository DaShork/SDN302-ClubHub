import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clubService } from '@/services/clubService'
import { eventService } from '@/services/eventService'
import { Card, Button, Badge, Loading, toast, ConfirmModal } from '@/components'
import { useMembership } from '@/stores/userStore'

const defaultLogo = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop'

export function MyClubsPage() {
  const { memberships, leave } = useMembership()
  const [clubs, setClubs] = useState([])
  const [eventCounts, setEventCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [confirmLeave, setConfirmLeave] = useState(null)

  useEffect(() => {
    if (memberships.length === 0) {
      setClubs([])
      setLoading(false)
      return
    }
    loadClubs()
  }, [memberships.length])

  const loadClubs = async () => {
    try {
      setLoading(true)
      const results = await Promise.all(
        memberships.map((m) => clubService.getById(m.clubId).catch(() => null)),
      )
      const filtered = results.filter(Boolean)
      setClubs(filtered)
      const counts = await Promise.all(
        memberships.map((m) =>
          eventService.getByClub(m.clubId, 50).then((ev) => [m.clubId, ev.length]).catch(() => [m.clubId, 0]),
        ),
      )
      setEventCounts(Object.fromEntries(counts))
    } catch (error) {
      console.error('Error loading my clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-primary py-12 md:py-16">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-accent-green text-sm font-semibold uppercase tracking-wider mb-2">
              My Dashboard
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-100 mb-2">
              My Clubs
            </h1>
            <p className="text-lg text-secondary-200">
              Clubs you've joined and their upcoming activities.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          {loading ? (
            <Loading />
          ) : memberships.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {clubs.map((club) => (
                <ClubRow
                  key={club.id}
                  club={club}
                  eventCount={eventCounts[club.id] || 0}
                  onLeave={() => setConfirmLeave(club)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        open={!!confirmLeave}
        title={`Leave ${confirmLeave?.name}?`}
        description="You can re-join later if recruitment is still open."
        confirmLabel="Leave Club"
        variant="danger"
        onCancel={() => setConfirmLeave(null)}
        onConfirm={() => {
          leave(confirmLeave.id)
          toast(`Left ${confirmLeave.name}`, { variant: 'info' })
          setConfirmLeave(null)
        }}
      />
    </div>
  )
}

function ClubRow({ club, eventCount, onLeave }) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Banner */}
        <div className="md:w-64 h-40 md:h-auto bg-primary-800 relative shrink-0">
          {club.cover_image_url || club.banner_url ? (
            <img
              src={club.cover_image_url || club.banner_url}
              alt={club.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img src={defaultLogo} alt="" className="h-16 w-16 opacity-30" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <img
              src={club.logo_url || defaultLogo}
              alt={club.name}
              className="h-14 w-14 rounded-xl object-cover border-2 border-white/20"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <Link to={`/clubs/${club.id}`}>
                  <h3 className="text-xl font-semibold text-secondary-100 hover:text-accent-green transition-colors">
                    {club.name}
                  </h3>
                </Link>
                {club.categories && (
                  <p className="text-sm text-secondary-300">{club.categories.name}</p>
                )}
              </div>
              <Badge variant="success">Member</Badge>
            </div>
            <p className="text-sm text-secondary-300 line-clamp-2 mt-3">
              {club.description || 'No description available.'}
            </p>
            <div className="flex items-center gap-6 mt-4 text-sm text-secondary-300">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {club.memberships?.length ?? 0} members
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {eventCount} events
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <Link to={`/clubs/${club.id}`}>
              <Button size="sm" variant="secondary">View Club</Button>
            </Link>
            <Link to={`/events?club=${club.id}`}>
              <Button size="sm" variant="ghost">Events</Button>
            </Link>
            <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200" onClick={onLeave}>
              Leave
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto h-20 w-20 rounded-2xl bg-primary-800 flex items-center justify-center mb-6">
        <svg className="h-10 w-10 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-secondary-100 mb-2">You haven't joined any clubs yet</h3>
      <p className="text-secondary-300 mb-6 max-w-sm mx-auto">
        Browse our clubs directory to discover communities that match your interests.
      </p>
      <Link to="/clubs">
        <Button size="lg">Explore Clubs</Button>
      </Link>
    </div>
  )
}
