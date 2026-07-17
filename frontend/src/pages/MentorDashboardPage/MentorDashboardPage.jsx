import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Megaphone, Calendar, Users, ChevronRight, RefreshCw, Building2 } from 'lucide-react';
import { Card, Button } from '@/components';
import { supabase } from '@/services/supabase.js';
import { useAuth } from '@/hooks/useAuth.jsx';
import './MentorDashboardPage.css';

/* Mentor Dashboard — read-only oversight surface.
 *
 * Mentors are assigned to one or more clubs via `clubs.mentor_id`. They
 * can see aggregated metrics across their clubs but cannot create or
 * edit any content themselves. All write affordances are intentionally
 * absent; if a mentor needs to act on a club, they must request a
 * Club Leader or Manager.
 *
 * Routes:
 *   - /mentor/dashboard   — this page (overview)
 *   - /clubs/<id>         — full club detail
 */
export default function MentorDashboardPage() {
  const { profileId } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [stats, setStats] = useState({
    clubs: 0,
    members: 0,
    events: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileId) loadData();
    // loadData is stable within this component; intentionally omitted to
    // prevent an infinite loop when loadData's identity changes on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch clubs where current profile is the mentor.
      const { data: clubsData, error: clubsErr } = await supabase
        .from('clubs')
        .select(`
          id, name, slug, logo_url, status, founded_year,
          categories (id, name),
          leader:profiles!clubs_leader_id_fkey (id, full_name, avatar_url)
        `)
        .eq('mentor_id', profileId)
        .order('name');
      if (clubsErr) throw clubsErr;
      const list = clubsData || [];
      setClubs(list);

      // Aggregate counts across those clubs
      if (list.length === 0) {
        setStats({ clubs: 0, members: 0, events: 0, announcements: 0 });
        return;
      }
      const clubIds = list.map((c) => c.id);
      const [membersRes, eventsRes, annsRes] = await Promise.all([
        supabase
          .from('memberships')
          .select('id', { count: 'exact', head: true })
          .in('club_id', clubIds)
          .eq('status', 'active'),
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .in('club_id', clubIds),
        supabase
          .from('announcements')
          .select('id', { count: 'exact', head: true })
          .in('club_id', clubIds),
      ]);

      setStats({
        clubs: list.length,
        members: membersRes.count || 0,
        events: eventsRes.count || 0,
        announcements: annsRes.count || 0,
      });
    } catch (err) {
      console.error('[MentorDashboard] load failed:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mentor-dashboard">
        <div className="mentor-dashboard__loading">
          <div className="mentor-dashboard__spinner" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-dashboard">
      <div className="mentor-dashboard__header">
        <div>
          <h1 className="mentor-dashboard__title">Mentor Dashboard</h1>
          <p className="mentor-dashboard__subtitle">
            Theo dõi hoạt động của các CLB bạn đang hỗ trợ.
          </p>
        </div>
        <div className="mentor-dashboard__header-actions">
          <Button variant="secondary" onClick={loadData}>
            <RefreshCw size={16} />
            Tải lại
          </Button>
        </div>
      </div>

      <div className="mentor-dashboard__section">
        <h2 className="mentor-dashboard__section-title">Tổng quan</h2>
        <div className="mentor-dashboard__stats">
          <StatCard icon={Building2} label="CLB phụ trách" value={stats.clubs} color="#22C55E" bgColor="#F0FDF4" />
          <StatCard icon={Users} label="Thành viên" value={stats.members} color="#3B82F6" bgColor="#EFF6FF" />
          <StatCard icon={Calendar} label="Sự kiện" value={stats.events} color="#F59E0B" bgColor="#FFFBEB" />
          <StatCard icon={Megaphone} label="Thông báo" value={stats.announcements} color="#8B5CF6" bgColor="#F5F3FF" />
        </div>
      </div>

      <div className="mentor-dashboard__section">
        <div className="mentor-dashboard__quick-actions">
          <Link to="/mentor/clubs" className="mentor-dashboard__quick-action">
            <Card className="mentor-dashboard__quick-action-card">
              <BookOpen size={22} style={{ color: '#22C55E' }} />
              <span>CLB của tôi</span>
              <ChevronRight size={18} />
            </Card>
          </Link>
          <Link to="/mentor/log" className="mentor-dashboard__quick-action">
            <Card className="mentor-dashboard__quick-action-card">
              <Megaphone size={22} style={{ color: '#3B82F6' }} />
              <span>Nhật ký hoạt động</span>
              <ChevronRight size={18} />
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <Card className="mentor-dashboard__stat-card">
      <div className="mentor-dashboard__stat-icon" style={{ background: bgColor }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="mentor-dashboard__stat-info">
        <span className="mentor-dashboard__stat-value">{value ?? '—'}</span>
        <span className="mentor-dashboard__stat-label">{label}</span>
      </div>
    </Card>
  );
}
