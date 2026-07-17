import { supabase } from '@/services/supabase';

/* ============================================================
   adminStatsService
   ------------------------------------------------------------
   Read-only aggregate queries powering the Admin Dashboard.
   All queries use RLS-scoped client (Administrator role required).
   ============================================================ */

const safeCount = async (builder) => {
  try {
    const { count } = await builder;
    return count ?? 0;
  } catch {
    return 0;
  }
};

/* ---------- Overview counters ---------- */

export async function getOverviewStats() {
  const [
    users, activeUsers, clubs, activeClubs,
    events, upcomingEvents, announcements,
    memberships, registrations,
  ] = await Promise.all([
    safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active')),
    safeCount(supabase.from('clubs').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'active')),
    safeCount(supabase.from('events').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'upcoming')),
    safeCount(supabase.from('announcements').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active')),
    safeCount(supabase.from('event_registrations').select('id', { count: 'exact', head: true })),
  ]);

  return {
    users, activeUsers, clubs, activeClubs,
    events, upcomingEvents, announcements,
    memberships, registrations,
  };
}

/* ---------- Time-series data ---------- */

/**
 * Returns user registrations grouped by month for the last N months.
 * Format: [{ month: '2026-01', label: 'T1', count: 12 }, ...]
 */
export async function getUserGrowth({ months = 6 } = {}) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;

    const buckets = buildMonthBuckets(months);
    const counts = Object.fromEntries(buckets.map((b) => [b.key, 0]));

    for (const row of data || []) {
      const d = new Date(row.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (counts[key] !== undefined) counts[key] += 1;
    }

    return buckets.map((b) => ({ ...b, count: counts[b.key] }));
  } catch {
    return buildMonthBuckets(months).map((b) => ({ ...b, count: 0 }));
  }
}

/**
 * Returns events grouped by status (upcoming/ongoing/finished/cancelled).
 */
export async function getEventStatusBreakdown() {
  try {
    const { data, error } = await supabase.from('events').select('status');
    if (error) throw error;
    const tally = { upcoming: 0, ongoing: 0, finished: 0, cancelled: 0 };
    for (const row of data || []) {
      if (tally[row.status] !== undefined) tally[row.status] += 1;
    }
    return Object.entries(tally).map(([name, value]) => ({ name, value }));
  } catch {
    return [];
  }
}

/**
 * Returns top clubs by member count (for the bar chart).
 */
export async function getTopClubsByMembers({ limit = 5 } = {}) {
  try {
    const [{ data: clubs, error: clubsErr }, { data: mems, error: memsErr }] = await Promise.all([
      supabase.from('clubs').select('id, name, logo_url').eq('status', 'active').limit(50),
      supabase.from('memberships').select('club_id').eq('status', 'active'),
    ]);
    if (clubsErr) throw clubsErr;
    if (memsErr) throw memsErr;

    const tally = {};
    for (const m of mems || []) {
      tally[m.club_id] = (tally[m.club_id] || 0) + 1;
    }

    return (clubs || [])
      .map((c) => ({ ...c, memberCount: tally[c.id] || 0 }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/* ---------- Recent activity ---------- */

export async function getRecentUsers({ limit = 5 } = {}) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, status, created_at, roles:role_id ( name )')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((u) => ({ ...u, role_name: u.roles?.name || null }));
  } catch {
    return [];
  }
}

export async function getRecentClubs({ limit = 5 } = {}) {
  try {
    const { data, error } = await supabase
      .from('clubs')
      .select('id, name, status, created_at, categories:category_id ( name )')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((c) => ({ ...c, category_name: c.categories?.name || null }));
  } catch {
    return [];
  }
}

export async function getRecentEvents({ limit = 5 } = {}) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, status, start_time, clubs:club_id ( name )')
      .order('start_time', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((e) => ({ ...e, club_name: e.clubs?.name || null }));
  } catch {
    return [];
  }
}

/* ---------- Helpers ---------- */

function buildMonthBuckets(months) {
  const out = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({
      key,
      label: `T${d.getMonth() + 1}`,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }
  return out;
}
