import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarDays, LogOut, Compass, Crown, UserCheck, CalendarRange } from 'lucide-react'
import { membershipService } from '@/services/membershipService'
import { Card, Button, Badge, Loading, toast, ConfirmModal, HeroSection } from '@/components'
import { useAuth } from '@/hooks/useAuth.jsx'
import './MyClubsPage.css'

const PLACEHOLDER_BANNER =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=400&fit=crop'
const PLACEHOLDER_LOGO =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop'

const formatPosition = (pos) => {
  if (!pos) return 'Member'
  const lower = pos.toLowerCase()
  if (lower.includes('leader') || lower.includes('president') || lower.includes('chairman')) return 'Leader'
  if (lower.includes('vice')) return 'Vice Leader'
  if (lower.includes('mentor')) return 'Mentor'
  if (lower.includes('head')) return 'Head'
  return pos
}

const isLeaderPosition = (pos) => {
  if (!pos) return false
  const lower = pos.toLowerCase()
  return lower.includes('leader') || lower.includes('president') || lower.includes('chairman')
}

export default function MyClubsPageContent() {
  const { profileId, isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmLeave, setConfirmLeave] = useState(null)
  const [leavingId, setLeavingId] = useState(null)

  const loadClubs = async () => {
    if (!profileId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await membershipService.getProfileMembershipsWithStats(profileId)
      setItems(data)
    } catch (error) {
      console.error('Error loading my clubs:', error)
      toast('Không thể tải danh sách CLB', { variant: 'error' })
      setItems([])
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

    // Refresh when tab regains focus
    const onFocus = () => loadClubs()
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, isAuthenticated])

  const handleLeave = async (item) => {
    if (!item?.clubId) return
    setLeavingId(item.clubId)
    try {
      await membershipService.leaveClub(item.clubId, profileId)
      toast('Đã rời CLB', { variant: 'info' })
      setConfirmLeave(null)
      // Optimistic update — remove from list immediately
      setItems((prev) => prev.filter((x) => x.clubId !== item.clubId))
    } catch (err) {
      console.error('Leave club failed:', err)
      toast('Không thể rời CLB', { variant: 'error' })
    } finally {
      setLeavingId(null)
    }
  }

  const totalMembers = items.reduce((s, x) => s + (x.memberCount || 0), 0)
  const totalUpcoming = items.reduce((s, x) => s + (x.upcomingEventCount || 0), 0)
  const leaderCount = items.filter((x) => isLeaderPosition(x.position)).length

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
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="my-clubs-stats">
                <StatChip icon={<Users size={16} />} value={items.length} label="Clubs joined" />
                <StatChip icon={<Crown size={16} />} value={leaderCount} label="Leadership roles" />
                <StatChip icon={<UserCheck size={16} />} value={totalMembers} label="Members total" />
                <StatChip icon={<CalendarDays size={16} />} value={totalUpcoming} label="Upcoming events" />
              </div>

              <div className="my-clubs-page__list">
                {items.map((item) => (
                  <ClubRow
                    key={item.membershipId}
                    item={item}
                    onLeave={() => setConfirmLeave(item)}
                    leaving={leavingId === item.clubId}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <ConfirmModal
        open={!!confirmLeave}
        title={`Leave ${confirmLeave?.club?.name}?`}
        description="You can re-join later if recruitment is still open."
        confirmLabel="Leave Club"
        variant="danger"
        onCancel={() => setConfirmLeave(null)}
        onConfirm={() => handleLeave(confirmLeave)}
      />
    </div>
  )
}

function StatChip({ icon, value, label }) {
  return (
    <div className="my-clubs-stat-chip">
      <span className="my-clubs-stat-chip__icon">{icon}</span>
      <span className="my-clubs-stat-chip__value">{value}</span>
      <span className="my-clubs-stat-chip__label">{label}</span>
    </div>
  )
}

function ClubRow({ item, onLeave, leaving }) {
  const { club, position, joinedAt, term, memberCount, upcomingEventCount } = item
  const isLeader = isLeaderPosition(position)
  const displayPosition = formatPosition(position)

  const banner = club?.banner_url || PLACEHOLDER_BANNER
  const logo = club?.logo_url || PLACEHOLDER_LOGO

  return (
    <Card className="my-clubs-row">
      <div className="my-clubs-row__layout">
        <div className="my-clubs-row__banner">
          <img
            src={banner}
            alt={club?.name}
            className="my-clubs-row__banner-img"
            loading="lazy"
          />
          <div className="my-clubs-row__logo">
            <img src={logo} alt={club?.name} className="my-clubs-row__logo-img" loading="lazy" />
          </div>
        </div>

        <div className="my-clubs-row__body">
          <div className="my-clubs-row__head">
            <div>
              <Link to={`/clubs/${club?.slug || club?.id}`}>
                <h3 className="my-clubs-row__name">{club?.name}</h3>
              </Link>
              {club?.category?.name && (
                <p className="my-clubs-row__category">{club.category.name}</p>
              )}
            </div>
            <div className="my-clubs-row__badges">
              {isLeader ? (
                <Badge variant="warning">
                  <Crown size={12} /> {displayPosition}
                </Badge>
              ) : (
                <Badge variant="success">{displayPosition}</Badge>
              )}
            </div>
          </div>

          <p className="my-clubs-row__desc">
            {club?.description || 'No description available.'}
          </p>

          <div className="my-clubs-row__meta">
            {term?.name && (
              <span className="my-clubs-row__meta-item">
                <CalendarRange size={14} /> {term.name}
              </span>
            )}
            {joinedAt && (
              <span className="my-clubs-row__meta-item">
                Joined {new Date(joinedAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>

          <div className="my-clubs-row__stats">
            <span className="my-clubs-row__stat">
              <Users size={16} />
              {memberCount} members
            </span>
            <span className="my-clubs-row__stat">
              <CalendarDays size={16} />
              {upcomingEventCount} upcoming events
            </span>
          </div>

          <div className="my-clubs-row__actions">
            <Link to={`/clubs/${club?.slug || club?.id}`}>
              <Button size="sm" variant="secondary">View Club</Button>
            </Link>
            <Link to={`/events?club=${club?.id}`}>
              <Button size="sm" variant="ghost">Events</Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="my-clubs-row__leave"
              onClick={onLeave}
              disabled={leaving}
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