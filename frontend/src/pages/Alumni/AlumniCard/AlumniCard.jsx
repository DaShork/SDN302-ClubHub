import { GraduationCap, Briefcase, Calendar, Link2 } from 'lucide-react';
import './AlumniCard.css';

export function AlumniCard({ alumni, onClick }) {
  const profile = alumni.profiles;
  const initials = (profile?.full_name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="alumni-card"
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(alumni)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(alumni)}
    >
      <div className="alumni-card__head">
        <div className="alumni-card__avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="alumni-card__name-block">
          <h3 className="alumni-card__name">{profile?.full_name || 'Unknown'}</h3>
          {profile?.student_code && (
            <p className="alumni-card__code">{profile.student_code}</p>
          )}
        </div>
      </div>

      <div className="alumni-card__meta">
        {profile?.faculty && (
          <span className="alumni-card__meta-item">
            <GraduationCap size={12} />
            {profile.faculty}
          </span>
        )}
        {alumni.company && (
          <span className="alumni-card__meta-item">
            <Briefcase size={12} />
            {alumni.company}
          </span>
        )}
        {alumni.graduation_year && (
          <span className="alumni-card__meta-item">
            <Calendar size={12} />
            Class of {alumni.graduation_year}
          </span>
        )}
      </div>

      {alumni.linkedin_url && (
        <a
          href={alumni.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="alumni-card__linkedin"
        >
          <Linkedin size={12} />
          LinkedIn
        </a>
      )}
    </div>
  );
}