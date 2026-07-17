import { supabase } from './supabase';

/**
 * Report Service
 * Aggregation queries for dashboard stats & charts.
 * Falls back to mock data if tables are empty or complex joins fail.
 */

async function safeQuery(queryFn) {
  try {
    return await queryFn();
  } catch {
    return { data: null, error: 'Query unavailable' };
  }
}

/** Overview: key metrics.
 *
 * NOTE: This service is intended for Admin/Manager only — RLS restricts
 * payments to "own or club-leader-of" scope. The caller (ReportsPage)
 * enforces the role check before calling; if reached by a Member the
 * numbers will be silently empty thanks to RLS.
 */
export async function getOverviewStats() {
  const [members, events, payments, articles] = await Promise.all([
    safeQuery(() => supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active')),
    safeQuery(() => supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'upcoming')),
    safeQuery(() => supabase
      .from('payments')
      .select('amount', { count: 'exact' })
      .eq('status', 'completed')
      .gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())),
    safeQuery(() => supabase.from('knowledge_articles').select('*', { count: 'exact', head: true })),
  ]);

  const totalRevenue = (payments.data || [])
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return {
    totalMembers: members.count || 0,
    activeEvents: events.count || 0,
    monthlyRevenue: totalRevenue,
    knowledgeArticles: articles.count || 0,
  };
}

/** Events per month (last 12 months) */
export async function getEventsPerMonth() {
  const { data, error } = await safeQuery(async () => {
    const { data: evts } = await supabase
      .from('events')
      .select('start_time')
      .gte('start_time', new Date(Date.now() - 365 * 86400000).toISOString());

    const counts = {};
    (evts || []).forEach(e => {
      const month = new Date(e.start_time).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      counts[month] = (counts[month] || 0) + 1;
    });

    return { data: Object.entries(counts).map(([month, count]) => ({ month, count })), error: null };
  });

  if (!data) return getMockEventsPerMonth();
  return { data, error };
}

/** Attendance trend (last 12 months) */
export async function getAttendanceTrend() {
  const { data, error } = await safeQuery(async () => {
    const { data: att } = await supabase
      .from('attendance')
      .select('check_in_time')
      .gte('check_in_time', new Date(Date.now() - 365 * 86400000).toISOString());

    const counts = {};
    (att || []).forEach(a => {
      const month = new Date(a.check_in_time).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      counts[month] = (counts[month] || 0) + 1;
    });

    return { data: Object.entries(counts).map(([month, count]) => ({ month, count })), error: null };
  });

  if (!data) return getMockAttendanceTrend();
  return { data, error };
}

/** Members per club (top 10) */
export async function getMembersPerClub() {
  const { data, error } = await safeQuery(async () => {
    const { data: clubs } = await supabase.from('clubs').select('name').eq('status', 'active').limit(10);
    const counts = await Promise.all(
      (clubs || []).map(async c => {
        const { count } = await supabase
          .from('memberships')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', c.id)
          .eq('status', 'active');
        return { club: c.name, members: count || 0 };
      })
    );
    return { data: counts, error: null };
  });

  if (!data) return getMockMembersPerClub();
  return { data, error };
}

/** Revenue per month (last 6 months).
 *
 * Same scope rule as getOverviewStats: intended for Admin/Manager.
 */
export async function getRevenuePerMonth() {
  const { data, error } = await safeQuery(async () => {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('status', 'completed')
      .gte('payment_date', new Date(Date.now() - 180 * 86400000).toISOString());

    const revenue = {};
    (payments || []).forEach(p => {
      const month = new Date(p.payment_date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      revenue[month] = (revenue[month] || 0) + parseFloat(p.amount || 0);
    });

    return { data: Object.entries(revenue).map(([month, revenue]) => ({ month, revenue })), error: null };
  });

  if (!data) return getMockRevenuePerMonth();
  return { data, error };
}

/** Cumulative revenue */
export async function getCumulativeRevenue() {
  const { data } = await getRevenuePerMonth();
  if (!data || data.length === 0) return getMockCumulativeRevenue();

  let cum = 0;
  const cumulative = data.map(d => ({ ...d, cumulative: (cum += d.revenue) }));
  return { data: cumulative, error: null };
}

/* ── Mock data fallbacks ──────────────────────────────────── */
function mockSeries(label, baseValue, months = 6) {
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      [label]: Math.max(0, baseValue + Math.floor(Math.random() * baseValue * 0.5) - baseValue * 0.25),
    });
  }
  return result;
}

export function getMockEventsPerMonth() {
  return { data: mockSeries('events', 8), error: null };
}

export function getMockAttendanceTrend() {
  return { data: mockSeries('attendance', 120), error: null };
}

export function getMockMembersPerClub() {
  return {
    data: [
      { club: 'Tech Club', members: 45 },
      { club: 'Chess Club', members: 32 },
      { club: 'Music Club', members: 28 },
      { club: 'AI Society', members: 24 },
      { club: 'Media Club', members: 19 },
    ],
    error: null,
  };
}

export function getMockRevenuePerMonth() {
  return {
    data: mockSeries('revenue', 500).map(d => ({ ...d, revenue: d.events * 50 })),
    error: null,
  };
}

export function getMockCumulativeRevenue() {
  const { data } = getMockRevenuePerMonth();
  if (!data) return { data: [], error: null };
  let cum = 0;
  return { data: data.map(d => ({ ...d, cumulative: (cum += d.revenue) })), error: null };
}
