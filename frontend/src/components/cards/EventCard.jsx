import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusVariants = {
  upcoming: 'upcoming',
  ongoing: 'ongoing',
  finished: 'finished',
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
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

export function EventCard({ event, className, showClub = true }) {
  return (
    <Link to={`/events/${event.id}`}>
      <Card hover className={cn('h-full flex flex-col', className)}>
        {/* Banner */}
        <div className="relative h-40 bg-linear-to-br from-primary-700 to-primary-800 overflow-hidden flex-shrink-0">
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="h-16 w-16 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <Badge
            variant={statusVariants[event.status] || 'upcoming'}
            className="absolute top-3 right-3"
          >
            {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-secondary-100 line-clamp-1 mb-2">
            {event.title}
          </h3>

          {/* Date & Time */}
          <div className="flex items-center gap-4 text-sm text-secondary-300 mb-2">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(event.start_time)}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(event.start_time)}
            </span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-1.5 text-sm text-secondary-300 mb-3">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          {/* Club */}
          {showClub && event.clubs && (
            <div className="mt-auto flex items-center gap-2 pt-3 border-t border-white/5">
              {event.clubs.logo_url && (
                <img
                  src={event.clubs.logo_url}
                  alt={event.clubs.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <span className="text-sm text-secondary-300">
                {event.clubs.name}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}

export function EventGrid({ events, className, showClub = true }) {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
      className
    )}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          showClub={showClub}
        />
      ))}
    </div>
  )
}
