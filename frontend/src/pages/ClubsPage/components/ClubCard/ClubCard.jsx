import { Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components';
import './ClubCard.css';

const PALETTE = [
  { bg: '#E8F5F0', color: '#16685D' },
  { bg: '#EFF6FF', color: '#3B82F6' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#FFFBEB', color: '#D97706' },
  { bg: '#F0FDF4', color: '#16A34A' },
  { bg: '#FEF2F2', color: '#EF4444' },
  { bg: '#FFF7ED', color: '#EA580C' },
  { bg: '#ECFDF5', color: '#059669' },
];

/** Pick a palette entry deterministically from the club name. */
function paletteFor(name = '') {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % PALETTE.length;
  return PALETTE[idx];
}

/** Normalise a Supabase club row to the shape ClubCard expects. */
export function normaliseClub(raw) {
  const pal = paletteFor(raw?.name || '');
  const fallbackId = raw?.id || '';
  return {
    id: fallbackId,
    slug: raw?.slug || fallbackId,
    name: raw?.name || 'Untitled club',
    description: raw?.description || '',
    shortDescription: raw?.short_description || '',
    logoUrl: raw?.logo_url || null,
    bannerUrl: raw?.banner_url || null,
    category: raw?.categories?.name || null,
    memberCount: raw?.member_count ?? raw?.memberships?.[0]?.count ?? 0,
    status: raw?.recruitment_status ? 'Recruiting' : 'Active',
    bg: pal.bg,
    color: pal.color,
    leaderId: raw?.leader_id || null,
    leaderName: raw?.leader_name || null,
    leaderAvatarUrl: raw?.leader_avatar_url || null,
    mentorId: raw?.mentor_id || null,
    mentorName: raw?.mentor_name || null,
    mentorAvatarUrl: raw?.mentor_avatar_url || null,
  };
}

export default function ClubCard({ club }) {
  const { id, name, description, logoUrl, category, memberCount, status, bg, color, slug } = club;
  const detailHref = slug || id;

  if (!detailHref) {
    return (
      <article className="club-card p-4 text-sm text-primary-700">
        Unavailable club record.
      </article>
    );
  }

  return (
    <article
      className="club-card"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(6, 35, 29, 0.07)',
      }}
    >
      <div className="club-card__head">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="club-card__logo"
            loading="lazy"
          />
        ) : (
          <div
            className="club-card__icon"
            style={{ background: bg }}
            aria-hidden="true"
          >
            <span style={{ fontSize: 30 }}>{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <StatusBadge status={status} />
      </div>

      <div className="club-card__body">
        <h3 className="club-card__title" style={{ color: '#06231D' }}>
          {name}
        </h3>
        {description && (
          <p className="club-card__desc" style={{ color: '#16685D' }}>
            {description}
          </p>
        )}
      </div>

      <div
        className="club-card__foot"
        style={{ borderTop: '1px solid rgba(6, 35, 29, 0.07)' }}
      >
        <div className="club-card__members" style={{ color: '#16685D' }}>
          <Users size={13} style={{ color: '#22C55E' }} />
          <span>{memberCount} members</span>
        </div>
        {category && (
          <span
            className="club-card__tag"
            style={{ background: bg, color }}
          >
            {category}
          </span>
        )}
      </div>

      <Link
        to={`/clubs/${detailHref}`}
        className="club-card__cta"
        style={{ color: '#0E4B43', borderColor: 'rgba(14, 75, 67, 0.25)' }}
      >
        View Details
      </Link>
    </article>
  );
}
