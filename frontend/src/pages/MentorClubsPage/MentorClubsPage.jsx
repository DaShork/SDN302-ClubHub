import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Users, Calendar, Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useMentoredClubIds } from '@/hooks/useMentoredClubIds';
import './MentorClubsPage.css';

/* Mentor "CLB của tôi" page.
 *
 * Rendered inside DashboardLayout for /mentor/clubs.
 *
 * Lists every club where the current user is the mentor (read-only),
 * with quick-glance aggregates (member/event/announcement counts)
 * so the mentor knows which clubs need attention.
 */
export default function MentorClubsPage() {
  const { ids: clubs, loading } = useMentoredClubIds();
  const [stats, setStats] = useState({}); // clubId -> {members, events, announcements}

  useEffect(() => {
    if (clubs.length === 0) {
      setStats({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const next = {};
        // Members — fetch rows so we can tally per club
        const { data: memRows } = await supabase
          .from('memberships')
          .select('club_id')
          .in('club_id', clubs.map((c) => c.id))
          .eq('status', 'active');
        (memRows || []).forEach((row) => {
          next[row.club_id] = next[row.club_id] || { members: 0, events: 0, announcements: 0 };
          next[row.club_id].members += 1;
        });

        // Events + announcements — use counts per club (cheap head+exact)
        await Promise.all(
          clubs.flatMap((club) => [
            supabase.from('events').select('id', { count: 'exact', head: true })
              .eq('club_id', club.id)
              .then(({ count }) => {
                next[club.id] = next[club.id] || { members: 0, events: 0, announcements: 0 };
                next[club.id].events = count || 0;
              }),
            supabase.from('announcements').select('id', { count: 'exact', head: true })
              .eq('club_id', club.id)
              .then(({ count }) => {
                next[club.id] = next[club.id] || { members: 0, events: 0, announcements: 0 };
                next[club.id].announcements = count || 0;
              }),
          ])
        );

        if (!cancelled) setStats(next);
      } catch (err) {
        if (!cancelled) console.error('Failed to aggregate mentor-club stats:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [clubs]);

  if (loading) {
    return (
      <div className="mentor-clubs">
        <div className="mentor-clubs__loading">
          <div className="mentor-clubs__spinner" />
          <span>Đang tải…</span>
        </div>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="mentor-clubs">
        <div className="mentor-clubs__header">
          <div>
            <h1 className="mentor-clubs__title">CLB của tôi</h1>
            <p className="mentor-clubs__subtitle">
              Danh sách các CLB bạn đang hỗ trợ với vai trò mentor.
            </p>
          </div>
        </div>
        <div className="mentor-clubs__empty">
          <BookOpen size={36} />
          <h3>Bạn hiện chưa được phân công làm mentor cho CLB nào.</h3>
          <p>Liên hệ Manager (IC-PDP) để được phân công.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-clubs">
      <div className="mentor-clubs__header">
        <div>
          <h1 className="mentor-clubs__title">CLB của tôi</h1>
          <p className="mentor-clubs__subtitle">
            Bạn đang hỗ trợ <strong>{clubs.length}</strong> CLB với vai trò mentor.
          </p>
        </div>
      </div>

      <div className="mentor-clubs__grid">
        {clubs.map((club) => {
          const s = stats[club.id] || { members: 0, events: 0, announcements: 0 };
          return (
            <Link
              key={club.id}
              to={`/clubs/${club.slug || club.id}`}
              className="mentor-clubs__card"
            >
              <div className="mentor-clubs__card-head">
                {club.logo_url ? (
                  <img src={club.logo_url} alt={club.name} className="mentor-clubs__logo" />
                ) : (
                  <div className="mentor-clubs__logo-placeholder">
                    {(club.name || 'C').charAt(0)}
                  </div>
                )}
                <div className="mentor-clubs__card-info">
                  <h3 className="mentor-clubs__card-name">{club.name}</h3>
                  <span className="mentor-clubs__card-cat">
                    {club.categories?.name || 'Chưa phân loại'}
                  </span>
                </div>
                <span className={`mentor-clubs__status mentor-clubs__status--${club.status}`}>
                  {club.status}
                </span>
              </div>

              {club.leader?.full_name && (
                <div className="mentor-clubs__leader">
                  Leader: <strong>{club.leader.full_name}</strong>
                </div>
              )}

              <div className="mentor-clubs__metrics">
                <div className="mentor-clubs__metric">
                  <Users size={14} />
                  <span>{s.members}</span>
                  <small>members</small>
                </div>
                <div className="mentor-clubs__metric">
                  <Calendar size={14} />
                  <span>{s.events}</span>
                  <small>events</small>
                </div>
                <div className="mentor-clubs__metric">
                  <Megaphone size={14} />
                  <span>{s.announcements}</span>
                  <small>anns</small>
                </div>
              </div>

              <div className="mentor-clubs__card-foot">
                <span>Xem chi tiết CLB</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
