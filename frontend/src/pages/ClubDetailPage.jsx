import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { clubService } from '@/services/clubService'
import { eventService } from '@/services/eventService'
import { galleryService } from '@/services/galleryService'
import { Card, Button, Badge, Loading } from '@/components'
import { EventCard, EventGrid } from '@/components/cards/EventCard'

const defaultLogo = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop'

export function ClubDetailPage() {
  const { id } = useParams()
  const [club, setClub] = useState(null)
  const [events, setEvents] = useState([])
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [clubData, eventsData, galleryData] = await Promise.all([
        clubService.getById(id),
        eventService.getByClub(id, 4),
        galleryService.getByClub(id),
      ])
      setClub(clubData)
      setEvents(eventsData || [])
      setGallery(galleryData || [])
    } catch (error) {
      console.error('Error loading club:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading fullScreen />

  if (!club) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-secondary-100 mb-4">Club not found</h1>
        <Link to="/clubs">
          <Button>Back to Clubs</Button>
        </Link>
      </div>
    )
  }

  const members = club.memberships?.filter(m => m.position !== 'President') || []
  const president = club.memberships?.find(m => m.position === 'President')

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-64 md:h-80 bg-linear-to-br from-primary-700 to-primary-800">
        {club.banner_url && (
          <img
            src={club.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-primary-900 to-transparent" />
        <div className="container relative h-full flex items-end pb-8">
          <div className="flex items-end gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-card border-4 border-white/10 overflow-hidden shadow-xl">
              <img
                src={club.logo_url || defaultLogo}
                alt={club.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-secondary-100">
                  {club.name}
                </h1>
                {club.recruitment_status && (
                  <Badge variant="default" className="bg-accent-green text-primary-900 font-semibold text-sm px-3 py-1">Recruiting</Badge>
                )}
              </div>
              {club.categories && (
                <p className="text-secondary-200">{club.categories.name}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-white/5 sticky top-[80px] bg-primary-900/95 backdrop-blur-sm z-40">
        <div className="container">
          <div className="flex gap-8">
            {['about', 'events', 'gallery', 'members'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 text-sm font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-accent-green border-accent-green'
                    : 'text-secondary-300 border-transparent hover:text-secondary-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-secondary-100 mb-4">About</h2>
                    <p className="text-secondary-200 leading-relaxed">
                      {club.description || 'No description available for this club.'}
                    </p>
                  </div>
                </Card>

                {club.club_terms && club.club_terms.length > 0 && (
                  <Card>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-secondary-100 mb-4">Current Term</h2>
                      <p className="text-secondary-200">
                        {club.club_terms[0].name} ({new Date(club.club_terms[0].start_date).toLocaleDateString()} - {club.club_terms[0].end_date ? new Date(club.club_terms[0].end_date).toLocaleDateString() : 'Present'})
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-100">Quick Info</h3>
                    {club.founded_year && (
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary-300">Founded</span>
                        <span className="text-secondary-100">{club.founded_year}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-300">Members</span>
                      <span className="text-secondary-100">{club.memberships?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-300">Status</span>
                      <Badge variant={club.status === 'active' ? 'success' : 'warning'}>
                        {club.status}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {club.recruitment_status && (
                  <Card className="bg-linear-to-br from-primary-800 to-accent-green/20 border-accent-green/30">
                    <div className="p-6 text-center">
                      <h3 className="text-lg font-semibold text-secondary-100 mb-2">
                        We're Recruiting!
                      </h3>
                      <p className="text-sm text-secondary-200 mb-4">
                        Join us and be part of something great
                      </p>
                      <Button className="w-full">Join Club</Button>
                    </div>
                  </Card>
                )}

                {club.contact_email && (
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-secondary-100 mb-4">Contact</h3>
                      <p className="text-secondary-200 text-sm">{club.contact_email}</p>
                      {club.facebook_url && (
                        <a
                          href={club.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-accent-green hover:underline"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Facebook Page
                        </a>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-100">Upcoming Events</h2>
                <Link to={`/events?club=${id}`}>
                  <Button variant="secondary" size="sm">View All</Button>
                </Link>
              </div>
              {events.length > 0 ? (
                <EventGrid events={events} />
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-secondary-300">No upcoming events</p>
                </Card>
              )}
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-100">Gallery</h2>
                <Link to={`/gallery?club=${id}`}>
                  <Button variant="secondary" size="sm">View All</Button>
                </Link>
              </div>
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gallery.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square rounded-xl overflow-hidden bg-card"
                    >
                      <img
                        src={item.image_url}
                        alt={item.caption || 'Gallery image'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-secondary-300">No gallery images</p>
                </Card>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {president && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-100 mb-4">President</h3>
                  <Card className="max-w-md">
                    <div className="p-4 flex items-center gap-4">
                      <img
                        src={president.profiles?.avatar_url || defaultLogo}
                        alt={president.profiles?.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-secondary-100">
                          {president.profiles?.full_name}
                        </p>
                        <p className="text-sm text-secondary-300">
                          {president.profiles?.email}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-secondary-100 mb-4">Members ({members.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {members.slice(0, 12).map((member) => (
                    <Card key={member.id} className="p-4 text-center">
                      <img
                        src={member.profiles?.avatar_url || defaultLogo}
                        alt={member.profiles?.full_name}
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                      />
                      <p className="font-medium text-secondary-100 text-sm">
                        {member.profiles?.full_name}
                      </p>
                      <p className="text-xs text-secondary-300">{member.position}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
