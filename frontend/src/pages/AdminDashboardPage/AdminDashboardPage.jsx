import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, UserCog, Activity, Shield, ArrowRight, BarChart3, Settings, Calendar, FileText, MessageSquare, GraduationCap, AlertCircle, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout.jsx';
import { Card, Button } from '@/components';
import { supabase } from '@/services/supabase.js';
import { ROLES, ROLE_META } from '@/auth/rolePermissions.js';
import './AdminDashboardPage.css';

function StatCard({ icon: Icon, label, value, color, bgColor, change, changeType }) {
  return (
    <Card className="admin-dashboard__stat-card">
      <div className="admin-dashboard__stat-icon" style={{ background: bgColor }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div className="admin-dashboard__stat-info">
        <span className="admin-dashboard__stat-value">{value ?? '—'}</span>
        <span className="admin-dashboard__stat-label">{label}</span>
        {change && (
          <span className={`admin-dashboard__stat-change admin-dashboard__stat-change--${changeType}`}>
            {changeType === 'up' ? '+' : changeType === 'down' ? '' : ''} {change}
          </span>
        )}
      </div>
    </Card>
  );
}

function RecentTable({ title, data, columns, emptyText }) {
  return (
    <Card className="admin-dashboard__table-card">
      <div className="admin-dashboard__table-header">
        <h3 className="admin-dashboard__table-title">{title}</h3>
      </div>
      {data.length === 0 ? (
        <div className="admin-dashboard__table-empty">{emptyText}</div>
      ) : (
        <div className="admin-dashboard__table-scroll">
          <table className="admin-dashboard__table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 5).map((item, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(item) : item[col.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    users: null,
    activeUsers: null,
    clubs: null,
    activeClubs: null,
    events: null,
    upcomingEvents: null,
    announcements: null,
    workshops: null,
    knowledgeArticles: null,
    documents: null,
    payments: null,
    memberships: null,
    registrations: null,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentClubs, setRecentClubs] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [
        profilesRes,
        activeProfilesRes,
        clubsRes,
        activeClubsRes,
        eventsRes,
        upcomingEventsRes,
        announcementsRes,
        workshopsRes,
        knowledgeRes,
        documentsRes,
        paymentsRes,
        membershipsRes,
        registrationsRes,
        recentProfilesRes,
        recentClubsRes,
        recentEventsRes,
        rolesRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('clubs').select('id', { count: 'exact', head: true }),
        supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'upcoming'),
        supabase.from('announcements').select('id', { count: 'exact', head: true }),
        supabase.from('workshops').select('id', { count: 'exact', head: true }),
        supabase.from('knowledge_articles').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true }),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('event_registrations').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, full_name, email, created_at, status, roles(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('clubs').select('id, name, created_at, status, categories(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('events').select('id, title, start_time, status, clubs(name)').order('start_time', { ascending: false }).limit(5),
        supabase.from('roles').select('id, name'),
      ]);

      // Role distribution
      const rolesData = rolesRes.data || [];
      const roleCounts = {};
      for (const role of rolesData) {
        const countRes = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role_id', role.id);
        roleCounts[role.name] = countRes.count || 0;
      }
      setRoleDistribution(Object.entries(roleCounts).map(([name, count]) => ({ name, count })));

      setStats({
        users: profilesRes.count,
        activeUsers: activeProfilesRes.count,
        clubs: clubsRes.count,
        activeClubs: activeClubsRes.count,
        events: eventsRes.count,
        upcomingEvents: upcomingEventsRes.count,
        announcements: announcementsRes.count,
        workshops: workshopsRes.count,
        knowledgeArticles: knowledgeRes.count,
        documents: documentsRes.count,
        payments: paymentsRes.count,
        memberships: membershipsRes.count,
        registrations: registrationsRes.count,
      });

      // Flatten recent profiles
      setRecentUsers((recentProfilesRes.data || []).map(p => ({
        ...p,
        role_name: p.roles?.name || '—',
      })));

      setRecentClubs((recentClubsRes.data || []).map(c => ({
        ...c,
        category_name: c.categories?.name || '—',
      })));

      setRecentEvents(recentEventsRes.data || []);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  }

  const userColumns = [
    { key: 'full_name', label: 'User' },
    { key: 'role_name', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Joined', render: (item) => item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '—' },
  ];

  const clubColumns = [
    { key: 'name', label: 'Club' },
    { key: 'category_name', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created', render: (item) => item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '—' },
  ];

  const eventColumns = [
    { key: 'title', label: 'Event' },
    { key: 'name', label: 'Club', render: (item) => item.clubs?.name || '—' },
    { key: 'status', label: 'Status' },
    { key: 'start_time', label: 'Date', render: (item) => item.start_time ? new Date(item.start_time).toLocaleDateString('vi-VN') : '—' },
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__container">
          <div className="admin-dashboard__loading">
            <div className="admin-dashboard__spinner" />
            <p>Đang tải dữ liệu hệ thống...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__container">
        <div className="admin-dashboard__header">
          <div className="admin-dashboard__header-content">
            <div>
              <h1 className="admin-dashboard__title">Admin Dashboard</h1>
              <p className="admin-dashboard__subtitle">
                Tổng quan toàn bộ hệ thống ClubHub FPTU
              </p>
            </div>
            <div className="admin-dashboard__header-actions">
              <Button variant="secondary" onClick={loadAllData}>
                <Activity size={16} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Core Stats */}
        <div className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title">Tổng quan hệ thống</h2>
          <div className="admin-dashboard__stats admin-dashboard__stats--4col">
            <StatCard icon={Users} label="Tổng Users" value={stats.users} color="#3B82F6" bgColor="#EFF6FF" change={`${stats.activeUsers} active`} changeType="up" />
            <StatCard icon={Building2} label="Tổng CLB" value={stats.clubs} color="#22C55E" bgColor="#F0FDF4" change={`${stats.activeClubs} active`} changeType="up" />
            <StatCard icon={Calendar} label="Sự kiện" value={stats.events} color="#F59E0B" bgColor="#FFFBEB" change={`${stats.upcomingEvents} sắp tới`} changeType="up" />
            <StatCard icon={MessageSquare} label="Thông báo" value={stats.announcements} color="#8B5CF6" bgColor="#F5F3FF" />
          </div>
        </div>

        {/* Second Row Stats */}
        <div className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title">Nội dung & Hoạt động</h2>
          <div className="admin-dashboard__stats admin-dashboard__stats--4col">
            <StatCard icon={GraduationCap} label="Thành viên" value={stats.memberships} color="#06B6D4" bgColor="#ECFEFF" />
            <StatCard icon={FileText} label="Tài liệu" value={stats.documents} color="#64748B" bgColor="#F8FAFC" />
            <StatCard icon={BarChart3} label="Workshop" value={stats.workshops} color="#EC4899" bgColor="#FDF2F8" />
            <StatCard icon={AlertCircle} label="Bài viết KB" value={stats.knowledgeArticles} color="#14B8A6" bgColor="#F0FDFA" />
          </div>
        </div>

        {/* Third Row Stats */}
        <div className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title">Tài chính & Đăng ký</h2>
          <div className="admin-dashboard__stats admin-dashboard__stats--4col">
            <StatCard icon={TrendingUp} label="Thanh toán" value={stats.payments} color="#22C55E" bgColor="#F0FDF4" />
            <StatCard icon={CheckCircle} label="Đăng ký sự kiện" value={stats.registrations} color="#3B82F6" bgColor="#EFF6FF" />
            <StatCard icon={Shield} label="Roles" value={roleDistribution.length} color="#8B5CF6" bgColor="#F5F3FF" />
            <StatCard icon={Settings} label="Cấu hình" value="—" color="#6B7280" bgColor="#F9FAFB" />
          </div>
        </div>

        {/* Role Distribution */}
        {roleDistribution.length > 0 && (
          <div className="admin-dashboard__section">
            <h2 className="admin-dashboard__section-title">Phân bổ vai trò</h2>
            <Card className="admin-dashboard__roles-card">
              <div className="admin-dashboard__roles-grid">
                {roleDistribution.map((role) => {
                  const meta = ROLE_META[role.name] || { label: role.name, color: '#6B7280' };
                  const percentage = stats.users ? Math.round((role.count / stats.users) * 100) : 0;
                  return (
                    <div key={role.name} className="admin-dashboard__role-item">
                      <div className="admin-dashboard__role-header">
                        <span className="admin-dashboard__role-name">{meta.label}</span>
                        <span className="admin-dashboard__role-count" style={{ color: meta.color }}>{role.count}</span>
                      </div>
                      <div className="admin-dashboard__role-bar">
                        <div
                          className="admin-dashboard__role-bar-fill"
                          style={{ width: `${percentage}%`, background: meta.color }}
                        />
                      </div>
                      <span className="admin-dashboard__role-percent">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Recent Data Tables */}
        <div className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title">Hoạt động gần đây</h2>
          <div className="admin-dashboard__tables-grid">
            <RecentTable
              title="Người dùng mới"
              data={recentUsers}
              columns={userColumns}
              emptyText="Chưa có người dùng"
            />
            <RecentTable
              title="CLB mới"
              data={recentClubs}
              columns={clubColumns}
              emptyText="Chưa có CLB"
            />
            <RecentTable
              title="Sự kiện gần đây"
              data={recentEvents}
              columns={eventColumns}
              emptyText="Chưa có sự kiện"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title">Quản lý nhanh</h2>
          <div className="admin-dashboard__quick-actions">
            <Link to="/admin/users" className="admin-dashboard__quick-action">
              <Card className="admin-dashboard__quick-action-card">
                <Users size={24} style={{ color: '#3B82F6' }} />
                <span>Quản lý Users</span>
                <ArrowRight size={18} />
              </Card>
            </Link>
            <Link to="/admin/roles" className="admin-dashboard__quick-action">
              <Card className="admin-dashboard__quick-action-card">
                <Shield size={24} style={{ color: '#8B5CF6' }} />
                <span>Quản lý Roles</span>
                <ArrowRight size={18} />
              </Card>
            </Link>
            <Link to="/clubs" className="admin-dashboard__quick-action">
              <Card className="admin-dashboard__quick-action-card">
                <Building2 size={24} style={{ color: '#22C55E' }} />
                <span>Quản lý CLB</span>
                <ArrowRight size={18} />
              </Card>
            </Link>
            <Link to="/settings" className="admin-dashboard__quick-action">
              <Card className="admin-dashboard__quick-action-card">
                <Settings size={24} style={{ color: '#6B7280' }} />
                <span>Cấu hình</span>
                <ArrowRight size={18} />
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
