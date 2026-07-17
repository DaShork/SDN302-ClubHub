/**
 * Approval Service
 * Handles multi-stage approval workflow for events and workshops.
 * Leader creates → Mentor approves → Manager approves → Public display
 */
import { supabase } from './supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-item`;

/**
 * Approve or reject an event or workshop.
 * @param {Object} params
 * @param {'event'|'workshop'} params.itemType
 * @param {string} params.itemId
 * @param {'approve'|'reject'} params.action
 * @param {string} [params.comment] - Reason for rejection
 */
export async function processApproval({ itemType, itemId, action, comment }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ item_type: itemType, item_id: itemId, action, comment }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Approval action failed');
  }

  return response.json();
}

/**
 * Get all items pending approval for Mentor (pending_mentor).
 * @returns {Promise<Array>}
 */
export async function getMentorPendingItems() {
  const [events, workshops] = await Promise.all([
    supabase
      .from('events')
      .select(`
        id, title, description, start_time, end_time, location, max_participants,
        status, banner_url, approval_status, created_at,
        clubs (id, name),
        profiles:created_by (id, full_name, avatar_url)
      `)
      .eq('approval_status', 'pending_mentor')
      .order('created_at', { ascending: false }),

    supabase
      .from('workshops')
      .select(`
        id, title, description, material_url, created_at,
        approval_status,
        clubs (id, name),
        profiles:created_by (id, full_name, avatar_url)
      `)
      .eq('approval_status', 'pending_mentor')
      .order('created_at', { ascending: false }),
  ]);

  return [
    ...(events.data || []).map(e => ({ ...e, _type: 'event' })),
    ...(workshops.data || []).map(w => ({ ...w, _type: 'workshop' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Get all items pending approval for Manager (pending_manager).
 * @returns {Promise<Array>}
 */
export async function getManagerPendingItems() {
  const [events, workshops] = await Promise.all([
    supabase
      .from('events')
      .select(`
        id, title, description, start_time, end_time, location, max_participants,
        status, banner_url, approval_status, created_at,
        mentor_id, mentor:mentor_id (id, full_name, avatar_url),
        clubs (id, name),
        profiles:created_by (id, full_name, avatar_url)
      `)
      .eq('approval_status', 'pending_manager')
      .order('created_at', { ascending: false }),

    supabase
      .from('workshops')
      .select(`
        id, title, description, material_url, created_at,
        approval_status, mentor_id, mentor:mentor_id (id, full_name, avatar_url),
        clubs (id, name),
        profiles:created_by (id, full_name, avatar_url)
      `)
      .eq('approval_status', 'pending_manager')
      .order('created_at', { ascending: false }),
  ]);

  return [
    ...(events.data || []).map(e => ({ ...e, _type: 'event' })),
    ...(workshops.data || []).map(w => ({ ...w, _type: 'workshop' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Get approval history for a specific item.
 * @param {'event'|'workshop'} itemType
 * @param {string} itemId
 * @returns {Promise<Array>}
 */
export async function getApprovalHistory(itemType, itemId) {
  const { data, error } = await supabase
    .from('approval_logs')
    .select(`
      id, action, comment, created_at,
      profiles:performed_by (id, full_name, avatar_url),
      approver_role
    `)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get events/workshops created by the leader, including approval status.
 * @returns {Promise<Array>}
 */
export async function getLeaderApprovalStatus() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [events, workshops] = await Promise.all([
    supabase
      .from('events')
      .select(`
        id, title, approval_status, created_at, start_time,
        mentor:mentor_id (id, full_name),
        manager:manager_id (id, full_name),
        rejected_at, rejection_reason
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('workshops')
      .select(`
        id, title, approval_status, created_at,
        mentor:mentor_id (id, full_name),
        manager:manager_id (id, full_name),
        rejected_at, rejection_reason
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false }),
  ]);

  return [
    ...(events.data || []).map(e => ({ ...e, _type: 'event' })),
    ...(workshops.data || []).map(w => ({ ...w, _type: 'workshop' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Status badge config for display
 */
export const APPROVAL_STATUS_CONFIG = {
  pending_mentor: {
    label: 'Chờ Mentor duyệt',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.10)',
  },
  pending_manager: {
    label: 'Chờ Manager duyệt',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.10)',
  },
  approved: {
    label: 'Đã phê duyệt',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.10)',
  },
  rejected: {
    label: 'Bị từ chối',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.10)',
  },
};
