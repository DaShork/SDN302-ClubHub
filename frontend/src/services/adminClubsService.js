import { supabase } from '@/services/supabase';
import { writeAuditLog } from '@/services/adminService';

/* ============================================================
   adminClubsService
   ------------------------------------------------------------
   Administrator-only operations on clubs. All writes assume the
   caller has role 'Administrator' (enforced by RLS in 002).
   ============================================================ */

const safeCount = async (builder) => {
  try {
    const { count } = await builder;
    return count ?? 0;
  } catch {
    return 0;
  }
};

/* ---------- Listing ---------- */

/**
 * List clubs with pagination + filters.
 * Includes category, leader profile, mentor profile, member count.
 */
export async function listClubs({
  page = 1,
  pageSize = 20,
  search = '',
  categoryId = '',
  status = '',
  recruitmentStatus = '',
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('clubs')
    .select(
      `id, name, slug, description, logo_url, banner_url,
       category_id, contact_email, facebook_url,
       recruitment_status, founded_year, status,
       leader_id, mentor_id,
       member_count, created_at, updated_at,
       categories ( id, name ),
       leader:leader_id ( id, full_name, email, avatar_url ),
       mentor:mentor_id ( id, full_name, email, avatar_url )`,
      { count: 'exact' }
    )
    .range(from, to)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (recruitmentStatus === 'open') query = query.eq('recruitment_status', true);
  if (recruitmentStatus === 'closed') query = query.eq('recruitment_status', false);
  if (search) {
    const safe = search.replace(/[%_]/g, '\\$&');
    query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%,contact_email.ilike.%${safe}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}

export async function getClubById(id) {
  const { data, error } = await supabase
    .from('clubs')
    .select(
      `id, name, slug, description, logo_url, banner_url,
       category_id, contact_email, facebook_url,
       recruitment_status, founded_year, status,
       leader_id, mentor_id,
       member_count, created_at, updated_at,
       categories ( id, name, description ),
       leader:leader_id ( id, full_name, email, avatar_url, role_id, roles ( name ) ),
       mentor:mentor_id ( id, full_name, email, avatar_url, role_id, roles ( name ) )`
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------- Mutations ---------- */

export async function updateClub(clubId, patch) {
  const cleaned = { ...patch, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('clubs')
    .update(cleaned)
    .eq('id', clubId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Change the club's leader. Also demotes the old leader's membership
 * to 'Member' and creates a 'President' membership for the new leader.
 */
export async function changeClubLeader(clubId, newLeaderId) {
  const { data, error } = await supabase
    .from('clubs')
    .update({ leader_id: newLeaderId, updated_at: new Date().toISOString() })
    .eq('id', clubId)
    .select()
    .single();
  if (error) throw error;
  // The trigger trg_sync_leader_id_to_memberships (migration 010) handles
  // the memberships table side-effects automatically.
  return data;
}

export async function changeClubMentor(clubId, mentorId) {
  const { data, error } = await supabase
    .from('clubs')
    .update({ mentor_id: mentorId, updated_at: new Date().toISOString() })
    .eq('id', clubId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Bulk change status of multiple clubs.
 */
export async function bulkUpdateClubStatus(clubIds, newStatus) {
  if (!clubIds?.length) return 0;
  const { data, error } = await supabase
    .from('clubs')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .in('id', clubIds)
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Toggle recruitment_status on multiple clubs.
 */
export async function bulkSetRecruitment(clubIds, open) {
  if (!clubIds?.length) return 0;
  const { data, error } = await supabase
    .from('clubs')
    .update({ recruitment_status: open, updated_at: new Date().toISOString() })
    .in('id', clubIds)
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Soft-archive a club (status='archived').
 * Hard delete is intentionally not exposed — only super-admins should
 * do that via Supabase dashboard.
 */
export async function archiveClub(clubId) {
  const { error } = await supabase
    .from('clubs')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', clubId);
  if (error) throw error;
  return true;
}

export async function activateClub(clubId) {
  const { error } = await supabase
    .from('clubs')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', clubId);
  if (error) throw error;
  return true;
}

/* ---------- Stats & helpers ---------- */

export async function getClubStats() {
  const [total, active, archived, recruiting, inactive] = await Promise.all([
    safeCount(supabase.from('clubs').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'active')),
    safeCount(supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'archived')),
    safeCount(supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('recruitment_status', true)),
    safeCount(supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'inactive')),
  ]);
  return { total, active, archived, recruiting, inactive };
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description')
    .order('name');
  if (error) throw error;
  return data || [];
}

/**
 * Search profiles to use as potential leader/mentor candidates.
 * Filters to roles: 'Club Leader', 'Mentor' by default.
 */
export async function searchLeaderCandidates({ search = '', limit = 20 } = {}) {
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role_id, roles ( name )')
    .eq('status', 'active')
    .limit(limit)
    .order('full_name');

  if (search) {
    const safe = search.replace(/[%_]/g, '\\$&');
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((u) => ({ ...u, role_name: u.roles?.name || null }));
}

/**
 * Return top-5 clubs by member count for a given category.
 */
export async function getClubsByCategory() {
  try {
    const { data, error } = await supabase
      .from('clubs')
      .select('id, category_id, member_count, categories ( name )')
      .eq('status', 'active');
    if (error) throw error;
    const tally = {};
    for (const c of data || []) {
      const name = c.categories?.name || 'Khác';
      tally[name] = (tally[name] || 0) + 1;
    }
    return Object.entries(tally).map(([name, value]) => ({ name, value }));
  } catch {
    return [];
  }
}

/**
 * Log an admin action on a club (helper for callers that bypass adminService).
 */
export async function auditClubAction({ actorId, clubId, action, details }) {
  await writeAuditLog({
    action,
    targetId: clubId,
    targetTable: 'clubs',
    actorId,
    details: details || {},
  });
}