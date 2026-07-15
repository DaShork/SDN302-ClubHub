import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, Calendar, MessageSquare, Megaphone,
  RefreshCw, ArrowRight, Activity, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components';
import {
  getOverviewStats,
  getUserGrowth,
  getTopClubsByMembers,
  getRecentUsers,
  getRecentClubs,
  getRecentEvents,
} from '@/services/adminStatsService';
import { getAuditLog, getRoleDistribution } from '@/services/adminService';

import StatsGrid from './components/StatsGrid/StatsGrid.jsx';
import UserGrowthChart from './components/UserGrowthChart/UserGrowthChart.jsx';
import RoleDistributionChart from './components/RoleDistributionChart/RoleDistributionChart.jsx';
import ClubActivityChart from './components/ClubActivityChart/ClubActivityChart.jsx';
import RecentActivityList from './components/RecentActivityList/RecentActivityList.jsx';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [roleDist, setRoleDist] = useState([]);
  const [topClubs, setTopClubs] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentClubs, setRecentClubs] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, g, rd, tc, ru, rc, re, audit] = await Promise.all([
        getOverviewStats(),
        getUserGrowth({ months: 6 }),
        getRoleDistribution(),
        getTopClubsByMembers({ limit: 5 }),
        getRecentUsers({ limit: 5 }),
        getRecentClubs({ limit: 5 }),
        getRecentEvents({ limit: 5 }),
        getAuditLog({ limit: 8 }),
      ]);
      setStats(ov);
      setGrowth(g);
      setRoleDist(rd);
      setTopClubs(tc);
      setRecentUsers(ru);
      setRecentClubs(rc);
      setRecentEvents(re);
      setAuditEntries(audit);
    } catch (err) {
      console.error('Admin dashboard load failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading || !stats) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__loading">
          <div className="admin-dashboard__spinner" />
          <p>Đang tải dữ liệu hệ thống...</p>
        </div>
      </div>
    );
  }

  const statTiles = [
    {
      icon: Users,
      label: 'Tổng Users',
      value: stats.users,
      sublabel: `${stats.activeUsers} đang hoạt động`,
      color: '#22C55E',
      bgColor: 'rgba(34,197,94,0.12)',
    },
    {
      icon: Building2,
      label: 'Câu lạc bộ',
      value: stats.clubs,
      sublabel: `${stats.activeClubs} đang hoạt động`,
      color: '#3B82F6',
      bgColor: 'rgba(59,130,246,0.12)',
    },
    {
      icon: Calendar,
      label: 'Sự kiện',
      value: stats.events,
      sublabel: `${stats.upcomingEvents} sắp tới`,
      color: '#F59E0B',
      bgColor: 'rgba(245,158,11,0.12)',
    },
    {
      icon: Megaphone,
      label: 'Thông báo',
      value: stats.announcements,
      sublabel: `${stats.registrations} lượt đăng ký`,
      color: '#8B5CF6',
      bgColor: 'rgba(139,92,246,0.12)',
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__container">
        {/* Header */}
        <div className="admin-dashboard__header">
          <div>
            <h1 className="admin-dashboard__title">Admin Dashboard</h1>
            <p className="admin-dashboard__subtitle">
              Tổng quan toàn bộ hệ thống ClubHub FPTU
            </p>
          </div>
          <div className="admin-dashboard__header-actions">
            <Button variant="ghost" onClick={loadAll}>
              <RefreshCw size={16} /> Refresh
            </Button>
          </div>
        </div>

        {/* Overview stats */}
        <section className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title">Tổng quan hệ thống</h2>
          <StatsGrid items={statTiles} />
        </section>

        {/* Charts row 1 */}
        <section className="admin-dashboard__section admin-dashboard__charts-row">
          <UserGrowthChart data={growth} />
          <RoleDistributionChart data={roleDist} />
        </section>

        {/* Charts row 2 */}
        <section className="admin-dashboard__section">
          <ClubActivityChart data={topClubs} />
        </section>

        {/* Recent activity */}
        <section className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title">Hoạt động gần đây</h2>
          <div className="admin-dashboard__recent-grid">
            <RecentActivityList
              title="Người dùng mới"
              icon={Users}
              items={recentUsers}
              type="user"
              viewAllLink="/admin/users"
              emptyText="Chưa có người dùng"
            />
            <RecentActivityList
              title="CLB mới"
              icon={Building2}
              items={recentClubs}
              type="club"
              viewAllLink="/clubs"
              emptyText="Chưa có CLB"
            />
            <RecentActivityList
              title="Sự kiện gần đây"
              icon={Calendar}
              items={recentEvents}
              type="event"
              viewAllLink="/events"
              emptyText="Chưa có sự kiện"
            />
          </div>
        </section>

        {/* Quick actions */}
        <section className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title">Quản lý nhanh</h2>
          <div className="admin-dashboard__quick-actions">
            <Link to="/admin/users" className="admin-dashboard__quick-action">
              <div className="admin-dashboard__quick-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                <Users size={20} />
              </div>
              <span>Quản lý Users</span>
              <ArrowRight size={16} className="admin-dashboard__quick-arrow" />
            </Link>
            <Link to="/admin/roles" className="admin-dashboard__quick-action">
              <div className="admin-dashboard__quick-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                <Activity size={20} />
              </div>
              <span>Quản lý Roles</span>
              <ArrowRight size={16} className="admin-dashboard__quick-arrow" />
            </Link>
            <Link to="/admin/clubs" className="admin-dashboard__quick-action">
              <div className="admin-dashboard__quick-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                <Building2 size={20} />
              </div>
              <span>Quản lý CLB</span>
              <ArrowRight size={16} className="admin-dashboard__quick-arrow" />
            </Link>
            <Link to="/admin/settings" className="admin-dashboard__quick-action">
              <div className="admin-dashboard__quick-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                <GraduationCap size={20} />
              </div>
              <span>Cấu hình</span>
              <ArrowRight size={16} className="admin-dashboard__quick-arrow" />
            </Link>
          </div>
        </section>

        {/* Audit log */}
        {auditEntries.length > 0 && (
          <section className="admin-dashboard__section">
            <h2 className="admin-dashboard__section-title">Nhật ký hoạt động</h2>
            <div className="admin-dashboard__audit">
              {auditEntries.map((entry) => (
                <div key={entry.id} className="admin-dashboard__audit-row">
                  <span className={`admin-dashboard__audit-action admin-dashboard__audit-action--${entry.action}`}>
                    {entry.action}
                  </span>
                  <span className="admin-dashboard__audit-target">
                    {entry.target_table}
                    {entry.target_id ? `/${String(entry.target_id).slice(0, 8)}…` : ''}
                  </span>
                  <span className="admin-dashboard__audit-time">
                    {new Date(entry.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
