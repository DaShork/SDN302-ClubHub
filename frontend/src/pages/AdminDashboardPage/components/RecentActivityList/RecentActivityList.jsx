import { Link } from 'react-router-dom';
import { Users, Building2, Calendar, ChevronRight } from 'lucide-react';
import { ROLE_META } from '@/auth/rolePermissions.js';
import './RecentActivityList.css';

const STATUS_COLOR = {
  active: '#22C55E',
  upcoming: '#22C55E',
  ongoing: '#3B82F6',
  finished: '#6B7280',
  cancelled: '#EF4444',
  inactive: '#F59E0B',
  archived: '#94A3B8',
};

function StatusDot({ value }) {
  const color = STATUS_COLOR[value] || '#6B7280';
  return <span className="admin-recent__dot" style={{ background: color }} title={value} />;
}

function RoleBadge({ name }) {
  const meta = ROLE_META[name] || { label: name || '—', color: '#6B7280' };
  return (
    <span
      className="admin-recent__role"
      style={{ background: `${meta.color}20`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function UserItem({ user }) {
  return (
    <Link to="/admin/users" className="admin-recent__row">
      <div className="admin-recent__avatar-placeholder">
        {(user.full_name || 'U').charAt(0)}
      </div>
      <div className="admin-recent__row-body">
        <span className="admin-recent__row-title">{user.full_name || user.email}</span>
        <span className="admin-recent__row-meta">
          <RoleBadge name={user.role_name} />
          <span>·</span>
          <span>{formatDate(user.created_at)}</span>
        </span>
      </div>
      <StatusDot value={user.status} />
    </Link>
  );
}

function ClubItem({ club }) {
  return (
    <Link to={`/clubs/${club.id}`} className="admin-recent__row">
      <div className="admin-recent__avatar-placeholder admin-recent__avatar-placeholder--club">
        {(club.name || 'C').charAt(0)}
      </div>
      <div className="admin-recent__row-body">
        <span className="admin-recent__row-title">{club.name}</span>
        <span className="admin-recent__row-meta">
          <span>{club.category_name || '—'}</span>
          <span>·</span>
          <span>{formatDate(club.created_at)}</span>
        </span>
      </div>
      <StatusDot value={club.status} />
    </Link>
  );
}

function EventItem({ event }) {
  return (
    <Link to={`/events/${event.id}`} className="admin-recent__row">
      <div className="admin-recent__avatar-placeholder admin-recent__avatar-placeholder--event">
        <Calendar size={14} />
      </div>
      <div className="admin-recent__row-body">
        <span className="admin-recent__row-title">{event.title}</span>
        <span className="admin-recent__row-meta">
          <span>{event.club_name || '—'}</span>
          <span>·</span>
          <span>{formatDate(event.start_time)}</span>
        </span>
      </div>
      <StatusDot value={event.status} />
    </Link>
  );
}

export default function RecentActivityList({ title, icon, items, type, viewAllLink, emptyText }) {
  const Icon = icon;
  return (
    <div className="admin-recent">
      <div className="admin-recent__header">
        <h3 className="admin-recent__title">
          <Icon size={16} /> {title}
        </h3>
        {viewAllLink && (
          <Link to={viewAllLink} className="admin-recent__view-all">
            Xem tất cả <ChevronRight size={12} />
          </Link>
        )}
      </div>

      <div className="admin-recent__list">
        {items.length === 0 ? (
          <div className="admin-recent__empty">{emptyText}</div>
        ) : (
          items.map((item) => {
            if (type === 'user') return <UserItem key={item.id} user={item} />;
            if (type === 'club') return <ClubItem key={item.id} club={item} />;
            if (type === 'event') return <EventItem key={item.id} event={item} />;
            return null;
          })
        )}
      </div>
    </div>
  );
}
