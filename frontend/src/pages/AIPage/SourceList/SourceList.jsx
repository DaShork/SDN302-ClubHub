import { BookOpen, FileText, Wrench, Megaphone, CalendarDays, Users } from 'lucide-react';
import './SourceList.css';

const TYPE_META = {
  article: { label: 'Knowledge Article', icon: BookOpen, color: '#3B82F6' },
  meeting: { label: 'Meeting Minutes', icon: FileText, color: '#F59E0B' },
  workshop: { label: 'Workshop', icon: Wrench, color: '#22C55E' },
  announcement: { label: 'Announcement', icon: Megaphone, color: '#8B5CF6' },
  event: { label: 'Event', icon: CalendarDays, color: '#06B6D4' },
  club: { label: 'Club', icon: Users, color: '#16685D' },
};

export function SourceList({ sources = [] }) {
  if (sources.length === 0) return null;

  return (
    <div className="source-list">
      <p className="source-list__title">Sources</p>
      <div className="source-list__items">
        {sources.map((s) => {
          const meta = TYPE_META[s.type] || TYPE_META.article;
          const Icon = meta.icon;
          return (
            <div key={`${s.type}-${s.id}`} className="source-list__item">
              <span
                className="source-list__type"
                style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
              >
                <Icon size={11} />
                {meta.label}
              </span>
              <div className="source-list__content">
                <p className="source-list__heading">
                  {s.title || '(untitled)'}
                  {s.clubName && (
                    <span className="source-list__club"> · {s.clubName}</span>
                  )}
                </p>
                {s.snippet && <p className="source-list__snippet">{s.snippet}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}