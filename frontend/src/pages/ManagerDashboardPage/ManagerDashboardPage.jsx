import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Megaphone, BarChart3, UserCog, Settings, Activity, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { Card, Button } from '@/components';
import { supabase } from '@/services/supabase.js';
import './ManagerDashboardPage.css';

const MANAGER_SIDEBAR_LINKS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/manager" },
  { icon: Building2, label: "Quản lý CLB", path: "/manager/clubs" },
  { icon: UserCog, label: "Quản lý Mentors", path: "/manager/mentors" },
  { icon: Megaphone, label: "Thông báo", path: "/manager/announcements" },
  { icon: BarChart3, label: "Báo cáo", path: "/manager/reports" },
];

const MANAGEMENT_LINKS = [
  { icon: Settings, label: "Cấu hình", path: "/settings" },
];

function StatCard({ icon: Icon, label, value, color, bgColor, change }) {
  return (
    <Card className="manager-dashboard__stat-card">
      <div className="manager-dashboard__stat-icon" style={{ background: bgColor }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div className="manager-dashboard__stat-info">
        <span className="manager-dashboard__stat-value">{value ?? '—'}</span>
        <span className="manager-dashboard__stat-label">{label}</span>
        {change && <span className="manager-dashboard__stat-change">{change}</span>}
      </div>
    </Card>
  );
}

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState({
    clubs: null,
    activeClubs: null,
    members: null,
    announcements: null,
    events: null,
    upcomingEvents: null,
    mentors: null,
  });
  const [recentClubs, setRecentClubs] = useState([]);
  const [topClubs, setTopClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [
        clubsRes,
        activeClubsRes,
        membersRes,
        announcementsRes,
        eventsRes,
        upcomingEventsRes,
        recentClubsRes,
        allClubsRes,
      ] = await Promise.all([
        supabase.from('clubs').select('id', { count: 'exact', head: true }),
        supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('announcements').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'upcoming'),
        supabase.from('clubs').select('id, name, logo_url, status, categories(name), created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(5),
        supabase.from('clubs').select('id, name, logo_url').eq('status', 'active').limit(10),
      ]);

      // Get member count per club for top clubs
      const topClubsData = [];
      for (const club of (allClubsRes.data || []).slice(0, 5)) {
        const countRes = await supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('club_id', club.id).eq('status', 'active');
        topClubsData.push({ ...club, memberCount: countRes.count || 0 });
      }
      topClubsData.sort((a, b) => b.memberCount - a.memberCount);
      setTopClubs(topClubsData);

      setStats({
        clubs: clubsRes.count,
        activeClubs: activeClubsRes.count,
        members: membersRes.count,
        announcements: announcementsRes.count,
        events: eventsRes.count,
        upcomingEvents: upcomingEventsRes.count,
        mentors: '—',
      });
      setRecentClubs((recentClubsRes.data || []).map(c => ({
        ...c,
        category_name: c.categories?.name || '—',
      })));
    } catch (err) {
      console.error('Failed to load manager data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="manager-dashboard">
        <div className="manager-dashboard__container">
          <div className="manager-dashboard__loading">
            <div className="manager-dashboard__spinner" />
            <p>Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-dashboard">
      <div className="manager-layout">
        {/* Sidebar - Dark Theme */}
        <aside className="manager-layout__sidebar">
          {/* Header with Logo */}
          <div className="manager-layout__sidebar-header">
            <div className="manager-layout__sidebar-logo">
              <img src="./assets/ClubHub_Logo_White.png" alt="Logo" />
            </div>
            <div className="manager-layout__sidebar-brand">
              <span className="manager-layout__sidebar-title">ClubHub</span>
              <span className="manager-layout__sidebar-subtitle">IC-PDP Management</span>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="manager-layout__sidebar-section">
            <span className="manager-layout__sidebar-section-title">Dashboard</span>
            <nav className="manager-layout__sidebar-nav">
              {MANAGER_SIDEBAR_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/manager"}
                    className={({ isActive }) =>
                      `manager-layout__sidebar-link ${isActive ? "manager-layout__sidebar-link--active" : ""}`
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="manager-layout__sidebar-divider" />

          {/* Management Section */}
          <div className="manager-layout__sidebar-section">
            <span className="manager-layout__sidebar-section-title">Management</span>
            <nav className="manager-layout__sidebar-nav">
              {MANAGEMENT_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `manager-layout__sidebar-link ${isActive ? "manager-layout__sidebar-link--active" : ""}`
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="manager-layout__sidebar-footer">
            <NavLink
              to="/"
              className="manager-layout__sidebar-link"
            >
              <Activity size={18} />
              <span>Back to Home</span>
            </NavLink>
          </div>
        </aside>

        {/* Main Content */}
        <main className="manager-layout__content">
          <div className="manager-dashboard__container">
            <div className="manager-dashboard__header">
              <div>
                <h1 className="manager-dashboard__title">IC-PDP Dashboard</h1>
                <p className="manager-dashboard__subtitle">
                  Quản lý và giám sát các hoạt động CLB trong hệ thống
                </p>
              </div>
              <div className="manager-dashboard__header-actions">
                <Button variant="secondary" onClick={loadData}>
                  <Activity size={16} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="manager-dashboard__section">
              <h2 className="manager-dashboard__section-title">Tổng quan</h2>
              <div className="manager-dashboard__stats">
                <StatCard icon={Building2} label="Tổng CLB" value={stats.clubs} color="#22C55E" bgColor="#F0FDF4" change={`${stats.activeClubs} đang hoạt động`} />
                <StatCard icon={Users} label="Thành viên" value={stats.members} color="#3B82F6" bgColor="#EFF6FF" />
                <StatCard icon={Calendar} label="Sự kiện" value={stats.events} color="#F59E0B" bgColor="#FFFBEB" change={`${stats.upcomingEvents} sắp tới`} />
                <StatCard icon={Megaphone} label="Thông báo" value={stats.announcements} color="#8B5CF6" bgColor="#F5F3FF" />
              </div>
            </div>

            {/* Content Grid */}
            <div className="manager-dashboard__content-grid">
              {/* Top Clubs by Members */}
              <Card className="manager-dashboard__card">
                <div className="manager-dashboard__card-header">
                  <h3 className="manager-dashboard__card-title">
                    <TrendingUp size={20} style={{ color: '#22C55E' }} />
                    Top CLB theo thành viên
                  </h3>
                </div>
                <div className="manager-dashboard__card-content">
                  {topClubs.length === 0 ? (
                    <p className="manager-dashboard__empty">Chưa có dữ liệu</p>
                  ) : (
                    <div className="manager-dashboard__club-list">
                      {topClubs.map((club, idx) => (
                        <div key={club.id} className="manager-dashboard__club-item">
                          <span className="manager-dashboard__club-rank">#{idx + 1}</span>
                          {club.logo_url ? (
                            <img src={club.logo_url} alt={club.name} className="manager-dashboard__club-logo" />
                          ) : (
                            <div className="manager-dashboard__club-logo-placeholder">
                              {club.name?.charAt(0) || 'C'}
                            </div>
                          )}
                          <span className="manager-dashboard__club-name">{club.name}</span>
                          <span className="manager-dashboard__club-members">{club.memberCount} members</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Recent Clubs */}
              <Card className="manager-dashboard__card">
                <div className="manager-dashboard__card-header">
                  <h3 className="manager-dashboard__card-title">
                    <Building2 size={20} style={{ color: '#3B82F6' }} />
                    CLB gần đây
                  </h3>
                  <Link to="/clubs" className="manager-dashboard__view-all">Xem tất cả</Link>
                </div>
                <div className="manager-dashboard__card-content">
                  {recentClubs.length === 0 ? (
                    <p className="manager-dashboard__empty">Chưa có CLB nào</p>
                  ) : (
                    <div className="manager-dashboard__club-list">
                      {recentClubs.map((club) => (
                        <Link
                          key={club.id}
                          to={`/clubs/${club.id}`}
                          className="manager-dashboard__club-item manager-dashboard__club-item--link"
                        >
                          {club.logo_url ? (
                            <img src={club.logo_url} alt={club.name} className="manager-dashboard__club-logo" />
                          ) : (
                            <div className="manager-dashboard__club-logo-placeholder">
                              {club.name?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div className="manager-dashboard__club-info">
                            <span className="manager-dashboard__club-name">{club.name}</span>
                            <span className="manager-dashboard__club-category">{club.category_name}</span>
                          </div>
                          <span className={`manager-dashboard__club-status manager-dashboard__club-status--${club.status}`}>
                            {club.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="manager-dashboard__section">
              <h2 className="manager-dashboard__section-title">Thao tác nhanh</h2>
              <div className="manager-dashboard__quick-actions">
                <Link to="/clubs" className="manager-dashboard__quick-action">
                  <Card className="manager-dashboard__quick-action-card">
                    <Building2 size={24} style={{ color: '#22C55E' }} />
                    <span>Quản lý CLB</span>
                    <ChevronRight size={18} />
                  </Card>
                </Link>
                <Link to="/manager/mentors" className="manager-dashboard__quick-action">
                  <Card className="manager-dashboard__quick-action-card">
                    <UserCog size={24} style={{ color: '#F59E0B' }} />
                    <span>Phân công Mentors</span>
                    <ChevronRight size={18} />
                  </Card>
                </Link>
                <Link to="/announcements" className="manager-dashboard__quick-action">
                  <Card className="manager-dashboard__quick-action-card">
                    <Megaphone size={24} style={{ color: '#8B5CF6' }} />
                    <span>Đăng thông báo</span>
                    <ChevronRight size={18} />
                  </Card>
                </Link>
                <Link to="/manager/reports" className="manager-dashboard__quick-action">
                  <Card className="manager-dashboard__quick-action-card">
                    <BarChart3 size={24} style={{ color: '#3B82F6' }} />
                    <span>Xem báo cáo</span>
                    <ChevronRight size={18} />
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
