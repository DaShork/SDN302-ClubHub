import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const defaultLogo = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop'

export function ClubCard({ club, className }) {
  const memberCount = club.memberships?.[0]?.count || 0

  return (
    <Link to={`/clubs/${club.id}`} className="block group">
      <Card className={cn('h-full transition-shadow hover:shadow-card-hover', className)}>
        {/* Banner */}
        <div className="relative h-44 overflow-visible">
          <img
            src={club.banner_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=300&fit=crop'}
            alt=""
            className="w-full h-full object-cover rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
          />
          {/* Logo overlay */}
          <div className="absolute -bottom-8 left-4 z-10">
            <div className="w-20 h-20 rounded-2xl bg-card border-2 border-white/20 overflow-hidden shadow-xl">
              <img
                src={club.logo_url || defaultLogo}
                alt={club.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {club.recruitment_status && (
            <Badge
              variant="default"
              className="absolute top-3 right-3 bg-accent-green text-primary-900 font-semibold"
            >
              Recruiting
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="pt-10 px-4 pb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-secondary-100 line-clamp-1">
              {club.name}
            </h3>
            {club.categories && (
              <Badge variant="secondary" className="text-xs">
                {club.categories.name}
              </Badge>
            )}
          </div>

          <p className="text-secondary-300 text-sm line-clamp-2 mb-3">
            {club.description || 'No description available'}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-secondary-300">
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {memberCount} members
            </span>
            {club.founded_year && (
              <span>Since {club.founded_year}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

export function ClubGrid({ clubs, className }) {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
      className
    )}>
      {clubs.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  )
}
