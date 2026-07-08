import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarDays, LogOut, Compass } from 'lucide-react'
import { clubService } from '@/services/clubService'
import { eventService } from '@/services/eventService'
import { membershipService } from '@/services/membershipService'
import { Card, Button, Badge, Loading, toast, ConfirmModal, HeroSection } from '@/components'
import { useAuth } from '@/hooks/useAuth.jsx'
import './MyClubsPage.css'

export default function MyClubsPageContent() {
  const { profileId, isAuthenticated } = useAuth()
  const [memberships, setMemberships] = useState([])
  const [clubs, setClubs] = useState([])
  const [eventCounts, setEventCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [confirmLeave, setConfirmLeave] = useState(null)

  const loadClubs = async () => {
    if (!profileId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const mems = await membershipService.getProfileMemberships(profileId).catch(() => [])
      setMemberships(mems)

      const results = await Promise.all(
        mems.map((m) => clubService.getById(m.club_id).catch(() => null)),
      )
      const filtered = results.filter(Boolean)
      setClubs(filtered)

      const counts = await Promise.all(
        mems.map((m) =>
          eventService
            .getClubEvents(m.club_id, 50)
            .then((ev) => [m.club_id, (ev || []).length])
            .catch(() => [m.club_id, 0]),
        ),
      )
      setEventCounts(Object.fromEntries(counts))
    } catch (error) {
      console.error('Error loading my clubs:', error)
      toast('Không thể tải danh sách CLB', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    loadClubs()
  }, [profileId])

  const handleLeave = async (clubId) => {
    try {
      await membershipService.leaveClub(clubId, profileId)
      toast('Đã rời CLB', { variant: 'info' })
      setConfirmLeave(null)
      loadClubs()
    } catch (err) {
      console.error('Leave club failed:', err)
      toast('Không thể rời CLB', { variant: 'error' })
    }
  }

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
        onConfirm={() => handleLeave(confirmLeave.id)}
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

const defaultLogo = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop'

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