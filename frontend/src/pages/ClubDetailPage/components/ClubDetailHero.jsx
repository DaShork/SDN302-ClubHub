import { Badge } from '@/components';

const defaultLogo = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop';

/**
 * Hero banner for the club detail page. Renders the gradient background,
 * the club logo, the club name, the category, and an optional recruiting
 * badge. Also renders the social share buttons in the top-right corner.
 */
export default function ClubDetailHero({ club, shareSlot }) {
  return (
    <section className="relative h-64 md:h-80 club-detail-hero">
      {club.banner_url && (
        <img
          src={club.banner_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}
      <div className="absolute inset-0 club-detail-hero-overlay" />
      <div className="container relative h-full flex items-end pb-8">
        <div className="w-full flex items-end justify-between gap-6">
          <div className="flex items-end gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-card border-4 border-white/10 overflow-hidden shadow-xl shrink-0 -> shrink-0">
              <img
                src={club.logo_url || defaultLogo}
                alt={club.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold text-secondary-100">
                  {club.name}
                </h1>
                {club.recruitment_status && (
                  <Badge
                    variant="default"
                    className="bg-accent-green text-primary-900 font-semibold text-sm px-3 py-1"
                  >
                    Recruiting
                  </Badge>
                )}
              </div>
              {club.categories && (
                <p className="text-primary-800">{club.categories.name}</p>
              )}
            </div>
          </div>
          {shareSlot && (
            <div className="hidden md:flex items-center gap-2 mb-2">
              {shareSlot}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
