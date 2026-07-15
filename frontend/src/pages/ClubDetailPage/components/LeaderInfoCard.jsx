import { Card } from '@/components';
import { User, GraduationCap } from 'lucide-react';

const defaultAvatar = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop';

/**
 * Card showing the club's leader and mentor (if any). Receives
 * the normalised leaderInfo from clubService.getLeaderInfo.
 *
 * For anon users, profiles may be partially hidden by RLS; the
 * component must therefore tolerate null/empty values gracefully.
 */
export default function LeaderInfoCard({ leaderInfo }) {
  if (!leaderInfo) return null;

  const leader = leaderInfo.l_profile || null;
  const mentor = leaderInfo.m_profile || null;

  if (!leader && !mentor) return null;

  return (
    <Card>
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-primary-900">Club Leadership</h3>
        {leader && (
          <div className="flex items-center gap-3">
            <img
              src={leader.avatar_url || defaultAvatar}
              alt={leader.full_name || 'Club leader'}
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-primary-700 mb-0.5">
                <User size={12} />
                <span>Club Leader</span>
              </div>
              <p className="font-medium text-primary-900 truncate">
                {leader.full_name || 'Anonymous'}
              </p>
              {leader.student_code && (
                <p className="text-xs text-primary-700">{leader.student_code}</p>
              )}
            </div>
          </div>
        )}
        {mentor && (
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <img
              src={mentor.avatar_url || defaultAvatar}
              alt={mentor.full_name || 'Mentor'}
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-primary-700 mb-0.5">
                <GraduationCap size={12} />
                <span>Mentor</span>
              </div>
              <p className="font-medium text-primary-900 truncate">
                {mentor.full_name || 'Anonymous'}
              </p>
              {mentor.email && (
                <p className="text-xs text-primary-700 truncate">{mentor.email}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
