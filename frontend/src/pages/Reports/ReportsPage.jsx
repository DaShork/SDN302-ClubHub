import { useState, useEffect } from 'react';
import {
  getOverviewStats,
  getEventsPerMonth,
  getAttendanceTrend,
  getMembersPerClub,
  getRevenuePerMonth,
  getCumulativeRevenue,
} from '../../services/reportService';
import { StatCard } from './components/StatCard';
import { BarChartCard } from './components/BarChartCard';
import { LineChartCard } from './components/LineChartCard';
import { PieChartCard } from './components/PieChartCard';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { Card } from '../../components/shared/Card';
import { Loader } from '../../components/shared/Loader';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events' },
  { id: 'members', label: 'Members' },
  { id: 'finance', label: 'Finance' },
];

const ICONS = {
  members: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  events: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  revenue: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  articles: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
};

export default function ReportsPage() {
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

  const fmtCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-8">
      <SectionHeader
        title="Reports & Analytics"
        subtitle="Insights into club activity, membership, and finances"
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-8 p-1 rounded-xl inline-flex" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              tab === id
                ? { background: 'linear-gradient(90deg, #0E4B43, #22C55E)', color: '#fff' }
                : { color: 'rgba(244,241,234,0.5)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader size="lg" />
        </div>
      ) : (
        <>
          {/* Overview */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Events */}
          {tab === 'events' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Members */}
          {tab === 'members' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PieChartCard
                title="Members per Club (Top)"
                data={membersData}
                dataKey="members"
                nameKey="club"
                height={350}
              />
              <Card className="p-5 !hover:translate-y-0">
                <h3 className="text-sm font-semibold text-secondary-100 mb-4">Member Count by Club</h3>
                <div className="flex flex-col gap-3">
                  {(membersData || []).map((m, i) => {
                    const max = Math.max(...(membersData || []).map(x => x.members));
                    return (
                      <div key={m.club} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-secondary-100">{m.club}</span>
                          <span className="text-sm font-medium text-accent-green">{m.members}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${max > 0 ? (m.members / max) * 100 : 0}%`,
                              background: `linear-gradient(90deg, #0E4B43, #${['22C55E', '3B82F6', 'F59E0B', '8B5CF6', 'EC4899'][i % 5]})`,
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

          {/* Finance */}
          {tab === 'finance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
