import { Users } from 'lucide-react';
import { StatusBadge } from '@/components';
import './ClubCard.css';

export default function ClubCard({ club }) {
  return (
    <article
      className="club-card"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(6, 35, 29, 0.07)',
      }}
    >
      <div className="club-card__head">
        <div
          className="club-card__icon"
          style={{ background: club.bg }}
          aria-hidden="true"
        >
          {club.icon}
        </div>
        <StatusBadge status={club.status} />
      </div>

      <div className="club-card__body">
        <h3 className="club-card__title" style={{ color: '#06231D' }}>
          {club.name}
        </h3>
        <p className="club-card__desc" style={{ color: '#16685D' }}>
          {club.description}
        </p>
      </div>

      <div
        className="club-card__foot"
        style={{ borderTop: '1px solid rgba(6, 35, 29, 0.07)' }}
      >
        <div className="club-card__members" style={{ color: '#16685D' }}>
          <Users size={13} style={{ color: '#22C55E' }} />
          <span>{club.members} members</span>
        </div>
        <span
          className="club-card__tag"
          style={{ background: club.bg, color: club.color }}
        >
          {club.category}
        </span>
      </div>

      <button
        type="button"
        className="club-card__cta"
        style={{ color: '#0E4B43', borderColor: 'rgba(14, 75, 67, 0.25)' }}
      >
        View Details
      </button>
    </article>
  );
}