import { useState, useEffect } from 'react';
import {
  Users, CalendarDays, Wallet, BookOpen, TrendingUp, TrendingDown,
} from 'lucide-react';
import { Card, Loading } from '@/components';
import {
  getOverviewStats, getEventsPerMonth, getAttendanceTrend,
  getMembersPerClub, getRevenuePerMonth, getCumulativeRevenue,
} from '@/services/reportService';
import { StatCard } from './StatCard/StatCard.jsx';
import { BarChartCard } from './BarChartCard/BarChartCard.jsx';
import { LineChartCard } from './LineChartCard/LineChartCard.jsx';
import { PieChartCard } from './PieChartCard/PieChartCard.jsx';
import './ReportsPage.css';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events' },
  { id: 'members', label: 'Members' },
  { id: 'finance', label: 'Finance' },
];

const ICONS = {
  members: <Users size={20} />,
  events: <CalendarDays size={20} />,
  revenue: <Wallet size={20} />,
  articles: <BookOpen size={20} />,
};

const MEMBER_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function ReportsPageContent() {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [cumulativeData, setCumulativeData] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [s, evts, att, mbrs, rev, cum] = await Promise.all([
        getOverviewStats(),
        getEventsPerMonth(),
        getAttendanceTrend(),
        getMembersPerClub(),
        getRevenuePerMonth(),
        getCumulativeRevenue(),
      ]);
      setStats(s);
      setEventsData(evts.data || []);
      setAttendanceData(att.data || []);
      setMembersData(mbrs.data || []);
      setRevenueData(rev.data || []);
      setCumulativeData(cum.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const fmtCurrency = (v) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(v || 0);

  return (
    <div className="reports-page">
      <header className="reports-page__head">
        <div>
          <h1 className="reports-page__title">Reports &amp; Analytics</h1>
          <p className="reports-page__subtitle">
            Insights into club activity, membership, and finances
          </p>
        </div>
      </header>

      <div className="reports-page__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`reports-page__tab ${tab === t.id ? 'reports-page__tab--active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="reports-page__loading">
          <Loading />
        </div>
      ) : (
        <>
          {tab === 'overview' && (
            <>
              <div className="reports-page__stats">
                <StatCard
                  title="Total Members"
                  value={stats?.totalMembers?.toLocaleString() || '—'}
                  icon={ICONS.members}
                  subtitle="Active memberships"
                />
                <StatCard
                  title="Active Events"
                  value={stats?.activeEvents?.toLocaleString() || '—'}
                  icon={ICONS.events}
                  subtitle="Upcoming"
                />
                <StatCard
                  title="Monthly Revenue"
                  value={fmtCurrency(stats?.monthlyRevenue)}
                  icon={ICONS.revenue}
                  subtitle="This month"
                />
                <StatCard
                  title="Knowledge Articles"
                  value={stats?.knowledgeArticles?.toLocaleString() || '—'}
                  icon={ICONS.articles}
                  subtitle="Total published"
                />
              </div>

              <div className="reports-page__grid reports-page__grid--two">
                <BarChartCard
                  title="Events This Year"
                  data={eventsData}
                  dataKey="count"
                  name="Events"
                  color="#22C55E"
                />
                <LineChartCard
                  title="Attendance Trend"
                  data={attendanceData}
                  dataKeys={[{ key: 'count', name: 'Attendance', color: '#3B82F6' }]}
                />
              </div>
            </>
          )}

          {tab === 'events' && (
            <div className="reports-page__grid reports-page__grid--two">
              <BarChartCard
                title="Events per Month"
                data={eventsData}
                dataKey="count"
                name="Events"
                color="#22C55E"
                height={350}
              />
              <LineChartCard
                title="Attendance per Month"
                data={attendanceData}
                dataKeys={[{ key: 'count', name: 'Attendance', color: '#3B82F6' }]}
                height={350}
              />
            </div>
          )}

          {tab === 'members' && (
            <div className="reports-page__grid reports-page__grid--two">
              <PieChartCard
                title="Members per Club"
                data={membersData}
                dataKey="members"
                nameKey="club"
                height={350}
              />
              <Card className="reports-page__member-bars">
                <h3 className="reports-page__chart-title">Member Count by Club</h3>
                <div className="reports-page__member-list">
                  {(membersData || []).map((m, i) => {
                    const max = Math.max(...(membersData || []).map((x) => x.members));
                    return (
                      <div key={m.club} className="reports-page__member-row">
                        <div className="reports-page__member-meta">
                          <span className="reports-page__member-name">{m.club}</span>
                          <span className="reports-page__member-count">{m.members}</span>
                        </div>
                        <div className="reports-page__member-track">
                          <div
                            className="reports-page__member-fill"
                            style={{
                              width: `${max > 0 ? (m.members / max) * 100 : 0}%`,
                              background: `linear-gradient(90deg, #0E4B43, ${MEMBER_COLORS[i % MEMBER_COLORS.length]})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {tab === 'finance' && (
            <div className="reports-page__grid reports-page__grid--two">
              <BarChartCard
                title="Revenue per Month (VND)"
                data={revenueData}
                dataKey="revenue"
                name="Revenue"
                color="#F59E0B"
                height={350}
              />
              <LineChartCard
                title="Cumulative Revenue (VND)"
                data={cumulativeData}
                dataKeys={[{ key: 'cumulative', name: 'Cumulative', color: '#22C55E' }]}
                height={350}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}