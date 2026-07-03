import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clubService } from '@/services/clubService'
import { eventService } from '@/services/eventService'
import { galleryService } from '@/services/galleryService'
import { Button, Loading } from '@/components'
import { ClubGrid } from '@/components/cards/ClubCard'
import { EventGrid } from '@/components/cards/EventCard'

export function HomePage() {
  const [featuredClubs, setFeaturedClubs] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [galleryPreview, setGalleryPreview] = useState([])
  const [stats, setStats] = useState({ totalClubs: 0, totalMembers: 0, upcomingEvents: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [clubsData, eventsData, statsData, galleryData] = await Promise.all([
        clubService.getFeatured(6),
        eventService.getUpcoming(4),
        clubService.getStats(),
        galleryService.getFeatured(4),
      ])
      setFeaturedClubs(clubsData || [])
      setUpcomingEvents(eventsData || [])
      setStats(statsData)
      setGalleryPreview(galleryData || [])
    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[600px] gradient-primary flex items-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-accent-green blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent-blue blur-[120px]" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-secondary-100 mb-6 leading-tight">
              Your Gateway to
              <span className="block text-accent-green">FPT Club Life</span>
            </h1>
            <p className="text-xl text-secondary-200 mb-8 leading-relaxed">
              Discover vibrant communities, join exciting events, and make lasting connections at FPT University
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/clubs">
                <Button size="lg">
                  Explore Clubs
                </Button>
              </Link>
              <Link to="/events">
                <Button variant="secondary" size="lg">
                  View Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary-900 border-y border-white/5">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-accent-green mb-2">
                {loading ? '-' : stats.totalClubs}
              </p>
              <p className="text-secondary-300">Active Clubs</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-accent-green mb-2">
                {loading ? '-' : stats.totalMembers}
              </p>
              <p className="text-secondary-300">Club Members</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-accent-green mb-2">
                {loading ? '-' : stats.upcomingEvents}
              </p>
              <p className="text-secondary-300">Upcoming Events</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clubs */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-secondary-100 mb-2">
                Featured Clubs
              </h2>
              <p className="text-secondary-300">
                Currently recruiting - Join now!
              </p>
            </div>
            <Link to="/clubs">
              <Button variant="secondary">
                View All →
              </Button>
            </Link>
          </div>

          {loading ? (
            <Loading />
          ) : featuredClubs.length > 0 ? (
            <ClubGrid clubs={featuredClubs} />
          ) : (
            <div className="text-center py-12 text-secondary-300">
              No clubs available at the moment
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-800">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary-100 mb-4">
              Ready to Find Your Community?
            </h2>
            <p className="text-secondary-200 mb-8">
              Browse through our diverse range of clubs and find the perfect match for your interests
            </p>
            <Link to="/clubs">
              <Button size="lg">
                Browse All Clubs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-secondary-100 mb-2">
                Upcoming Events
              </h2>
              <p className="text-secondary-300">
                Don't miss out on exciting activities
              </p>
            </div>
            <Link to="/events">
              <Button variant="secondary">
                View All →
              </Button>
            </Link>
          </div>

          {loading ? (
            <Loading />
          ) : upcomingEvents.length > 0 ? (
            <EventGrid events={upcomingEvents} />
          ) : (
            <div className="text-center py-12 text-secondary-300">
              No upcoming events at the moment
            </div>
          )}
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-16 bg-primary-800">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-secondary-100 mb-2">
                From Our Gallery
              </h2>
              <p className="text-secondary-300">
                Memories from club activities
              </p>
            </div>
            <Link to="/gallery">
              <Button variant="secondary">
                View All →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full text-center text-secondary-300 py-8">Loading gallery...</div>
            ) : galleryPreview.length > 0 ? (
              galleryPreview.map((item) => (
                <Link
                  to="/gallery"
                  key={item.id}
                  className="aspect-square rounded-xl overflow-hidden bg-card block"
                >
                  <img
                    src={item.image_url}
                    alt={item.caption || 'Gallery image'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-linear-to-br from-primary-700 to-primary-800 flex items-center justify-center"
                >
                  <span className="text-primary-600 text-4xl font-bold">{i}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
