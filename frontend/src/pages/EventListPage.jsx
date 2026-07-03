import { useState, useEffect } from 'react'
import { eventService } from '@/services/eventService'
import { EventGrid, SearchBar } from '@/components'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

const statusFilters = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'finished', label: 'Finished' },
]

export function EventListPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('upcoming')

  useEffect(() => {
    loadEvents()
  }, [statusFilter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await eventService.getAll({
        status: statusFilter,
      })
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-primary py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-100 mb-4">
              Upcoming Events
            </h1>
            <p className="text-lg text-secondary-200 mb-8">
              Discover and join exciting events from clubs across FPT University
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container">
          {/* Status Filters */}
          <div className="flex items-center gap-3 mb-8">
            {statusFilters.map((filter) => (
              <Badge
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'default'}
                className={`cursor-pointer transition-all px-4 py-2 ${
                  statusFilter === filter.value
                    ? 'bg-accent-green text-white'
                    : 'bg-primary-700 text-secondary-200 hover:bg-primary-600'
                }`}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </Badge>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <Loading />
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-secondary-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-secondary-100 mb-2">No events found</h3>
              <p className="text-secondary-300">Check back later for upcoming events</p>
            </div>
          ) : (
            <>
              <p className="text-secondary-300 mb-6">{events.length} events found</p>
              <EventGrid events={events} />
            </>
          )}
        </div>
      </section>
    </div>
  )
}
