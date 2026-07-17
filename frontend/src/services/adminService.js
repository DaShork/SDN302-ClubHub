import { supabase } from '@/services/supabase';

/* ============================================================
   adminService
   ------------------------------------------------------------
   Centralised calls for the Administrator dashboard.
   All write operations require RLS role 'Administrator' which
   is enforced server-side by 002_rls_policies.sql.
   ============================================================ */

/* ---------- Users ---------- */

/**
 * List profiles with optional filters. Returns the rows plus the exact
 * `count` from PostgREST so the UI can paginate.
 *
 * @param {object} options
 * @param {number} [options.page=1]
 * @param {number} [options.pageSize=20]
 * @param {string} [options.search]
 * @param {string} [options.roleId]        UUID of the role
 * @param {string} [options.status]        active | inactive | banned | deleted
 * @param {string} [options.orderBy='created_at']
 * @param {boolean} [options.asc=false]
 */
export async function listUsers({
  page = 1,
  pageSize = 20,
  search = '',
  roleId = '',
  status = '',
  orderBy = 'created_at',
  asc = false,
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('profiles')
    .select(
      `id, full_name, student_code, email, avatar_url, faculty, major, phone,
       status, role_id, created_at, updated_at,
       roles:role_id ( id, name )`,
      { count: 'exact' }
    )
    .range(from, to)
    .order(orderBy, { ascending: asc });

  if (status) query = query.eq('status', status);
  if (roleId) query = query.eq('role_id', roleId);
  if (search) {
    const safe = search.replace(/[%_]/g, '\\$&');
    query = query.or(
      `full_name.ilike.%${safe}%,email.ilike.%${safe}%,student_code.ilike.%${safe}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data || []).map((u) => ({
    ...u,
    role_name: u.roles?.name ?? null,
    role_uuid: u.roles?.id ?? u.role_id,
  }));

  return { rows, count: count || 0 };
}

/** Fetch a single profile by id (for the edit modal). */
export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `id, full_name, student_code, email, avatar_url, faculty, major, phone,
       status, role_id, created_at, updated_at,
       roles:role_id ( id, name )`
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    role_name: data.roles?.name ?? null,
  };
}

/**
 * Update a profile (admin override). Only the fields provided will be sent.
 * Returns the updated row.
 */
export async function updateUser(userId, patch) {
  const cleaned = { ...patch };
  if ('updated_at' in cleaned) delete cleaned.updated_at;
  cleaned.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update(cleaned)
    .eq('id', userId)
    .select(
      `id, full_name, email, status, role_id,
       roles:role_id ( id, name )`
    )
    .single();
  if (error) throw error;
  return data;
}

/**
 * Soft-delete a user: mark profile as 'deleted' and anonymise email/name.
 * Hard-delete of auth.users requires the Supabase service role key
 * (Edge Function) — never expose it to the browser.
 */
export async function softDeleteUser(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'deleted',
      email: `deleted_${userId}@removed.local`,
      full_name: 'Deleted User',
      student_code: null,
      avatar_url: null,
      phone: null,
      faculty: null,
      major: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) throw error;
  return true;
}

/**
 * Bulk action on multiple users. Supports status changes only.
 */
export async function bulkUpdateUserStatus(userIds, newStatus) {
  if (!userIds?.length) return 0;
  const { error, count } = await supabase
    .from('profiles')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .in('id', userIds);
  if (error) throw error;
  return count ?? userIds.length;
}

/* ---------- Roles ---------- */

export async function listRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

/* ---------- Stats ---------- */

/**
 * Aggregate counts for the admin dashboard. Returns nulls for any
 * query that fails so the UI can still render partial data.
 */
export async function getUserStats() {
  const safeCount = async (builder) => {
    try {
      const { count } = await builder;
      return count ?? null;
    } catch {
      return null;
    }
  };

  const [
    total,
    active,
    inactive,
    banned,
    deleted,
    withRole,
  ] = await Promise.all([
    safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true })),
    safeCount(
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active')
    ),
    safeCount(
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'inactive')
    ),
    safeCount(
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'banned')
    ),
    safeCount(
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'deleted')
    ),
    safeCount(
      supabase.from('profiles').select('id', { count: 'exact', head: true }).not('role_id', 'is', null)
    ),
  ]);

  return { total, active, inactive, banned, deleted, withRole };
}

/** Number of users per role (for the role-distribution chart). */
export async function getRoleDistribution() {
  const { data: roles, error } = await supabase.from('roles').select('id, name');
  if (error) throw error;
  const out = [];
  for (const role of roles || []) {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', role.id);
    out.push({ name: role.name, count: count || 0 });
  }
  return out;
}

/* ---------- Audit log ---------- */

/**
 * Fetch recent audit log entries. Returns [] if the table doesn't
 * exist yet (migration 012 not run).
 */
export async function getAuditLog({ limit = 50 } = {}) {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('id, action, target_id, target_table, actor_id, details, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Manually write an audit-log entry. The migration 012 trigger will
 * also do this automatically for profile updates, but this helper lets
 * the UI log custom actions (e.g. bulk operations).
 */
export async function writeAuditLog({ action, targetId, targetTable, actorId, details }) {
  try {
    await supabase.from('audit_log').insert({
      action,
      target_id: targetId,
      target_table: targetTable,
      actor_id: actorId,
      details: details || {},
    });
  } catch {
    /* audit log is best-effort */
  }
}