import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarDays, LogOut, Compass } from 'lucide-react'
import MainLayout from '@/layouts/MainLayout.jsx'
import { clubService } from '@/services/clubService'
import { eventService } from '@/services/eventService'
import { Card, Button, Badge, Loading, toast, ConfirmModal, HeroSection } from '@/components'
import { useMembership } from '@/stores/userStore'
import './MyClubsPage.css'

export default function MyClubsPage() {
  return (
    <MainLayout>
      <MyClubsPageContent />
    </MainLayout>
  )
}

function MyClubsPageContent() {
  const { memberships, leave } = useMembership()
  const [clubs, setClubs] = useState([])
  const [eventCounts, setEventCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [confirmLeave, setConfirmLeave] = useState(null)

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

  useEffect(() => {
    if (memberships.length === 0) {
      setClubs([])
      setLoading(false)
      return
    }
    loadClubs()
  }, [memberships.length])

  return (
    <div className="my-clubs-page">
      <HeroSection
        variant="myclubs"
        eyebrow="My Dashboard"
        title="My"
        titleGradient="Clubs"
        subtitle="Clubs you've joined and their upcoming activities."
      />

      <section className="my-clubs-page__content">
        <div className="my-clubs-page__container">
          {loading ? (
            <Loading />
          ) : memberships.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="my-clubs-page__list">
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
    <Card className="my-clubs-row">
      <div className="my-clubs-row__layout">
        <div className="my-clubs-row__banner">
          {club.cover_image_url || club.banner_url ? (
            <img
              src={club.cover_image_url || club.banner_url}
              alt={club.name}
              className="my-clubs-row__banner-img"
            />
          ) : (
            <div className="my-clubs-row__banner-placeholder">
              <img src={defaultLogo} alt="" className="my-clubs-row__banner-logo" />
            </div>
          )}
          <div className="my-clubs-row__logo">
            <img
              src={club.logo_url || defaultLogo}
              alt={club.name}
              className="my-clubs-row__logo-img"
            />
          </div>
        </div>

        <div className="my-clubs-row__body">
          <div className="my-clubs-row__head">
            <div>
              <Link to={`/clubs/${club.id}`}>
                <h3 className="my-clubs-row__name">{club.name}</h3>
              </Link>
              {club.categories && (
                <p className="my-clubs-row__category">{club.categories.name}</p>
              )}
            </div>
            <Badge variant="success">Member</Badge>
          </div>
          <p className="my-clubs-row__desc">
            {club.description || 'No description available.'}
          </p>
          <div className="my-clubs-row__stats">
            <span className="my-clubs-row__stat">
              <Users size={16} />
              {club.memberships?.length ?? 0} members
            </span>
            <span className="my-clubs-row__stat">
              <CalendarDays size={16} />
              {eventCount} events
            </span>
          </div>
          <div className="my-clubs-row__actions">
            <Link to={`/clubs/${club.id}`}>
              <Button size="sm" variant="secondary">View Club</Button>
            </Link>
            <Link to={`/events?club=${club.id}`}>
              <Button size="sm" variant="ghost">Events</Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="my-clubs-row__leave"
              onClick={onLeave}
              leftIcon={<LogOut size={14} />}
            >
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
    <div className="my-clubs-empty">
      <div className="my-clubs-empty__icon">
        <Compass size={40} />
      </div>
      <h3 className="my-clubs-empty__title">You haven't joined any clubs yet</h3>
      <p className="my-clubs-empty__desc">
        Browse our clubs directory to discover communities that match your interests.
      </p>
      <Link to="/clubs">
        <Button size="lg">Explore Clubs</Button>
      </Link>
    </div>
  )
}