import { Link } from 'react-router-dom';
import { Card } from '@/components';
import ClubCard, { normaliseClub } from '@/pages/ClubsPage/components/ClubCard/ClubCard.jsx';

const defaultLogo = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop';

/**
 * "You might also like" section. Shows up to 4 other clubs in the
 * same category. Receives raw Supabase rows from clubService.getRelated
 * and normalises them via the shared normaliseClub() helper.
 */
export default function RelatedClubs({ clubs, categoryName }) {
  if (!clubs || clubs.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-white/5">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-primary-900">
            Other {categoryName || 'related'} clubs
          </h2>
          <p className="text-sm text-primary-700 mt-1">
            Explore more communities you might enjoy.
          </p>
        </div>
        <Link
          to="/clubs"
          className="text-sm font-semibold text-accent-green hover:underline"
        >
          View all clubs →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {clubs.slice(0, 4).map((raw) => {
          const club = normaliseClub(raw);
          return <ClubCard key={club.id} club={club} />;
        })}
      </div>
    </section>
  );
}
