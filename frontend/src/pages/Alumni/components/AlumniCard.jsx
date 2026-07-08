import { Avatar } from '../../../components/shared/Avatar';

export function AlumniCard({ alumni, onClick }) {
  const profile = alumni.profiles;
  return (
    <div
      onClick={() => onClick?.(alumni)}
      className="card-base p-5 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(alumni)}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={profile?.full_name} src={profile?.avatar_url} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-secondary-100 truncate">{profile?.full_name || 'Unknown'}</h3>
          <p className="text-xs" style={{ color: 'rgba(244,241,234,0.4)' }}>{profile?.student_code || ''}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {profile?.faculty && (
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(244,241,234,0.3)" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            <span className="text-xs truncate" style={{ color: 'rgba(244,241,234,0.5)' }}>{profile.faculty}</span>
          </div>
        )}
        {alumni.company && (
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(244,241,234,0.3)" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
            </svg>
            <span className="text-xs truncate" style={{ color: 'rgba(244,241,234,0.5)' }}>{alumni.company}</span>
          </div>
        )}
        {alumni.graduation_year && (
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(244,241,234,0.3)" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            </svg>
            <span className="text-xs" style={{ color: 'rgba(244,241,234,0.5)' }}>Class of {alumni.graduation_year}</span>
          </div>
        )}
      </div>

      {alumni.linkedin_url && (
        <a
          href={alumni.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 mt-3 text-xs transition-colors hover:text-accent-blue"
          style={{ color: '#3B82F6' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
          </svg>
          LinkedIn
        </a>
      )}
    </div>
  );
}
