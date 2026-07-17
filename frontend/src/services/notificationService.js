import { supabase } from './supabase';

/**
 * Notification Service
 * CRUD + realtime subscription for notifications.
 */

export async function listNotifications(profileId, { limit = 30, unreadOnly = false } = {}) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

export async function getUnreadCount(profileId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('is_read', false);
  return { count: count || 0, error };
}

export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  return { error };
}

export async function markAllAsRead(profileId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', profileId)
    .eq('is_read', false);
  return { error };
}

export async function deleteNotification(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
  return { error };
}

/** Subscribe to realtime notification changes for a profile.
 *  Pass a unique `context` string (e.g. 'bell' | 'page') to avoid channel
 *  name collisions when multiple components subscribe simultaneously. */
export function subscribeNotifications(profileId, onChange, context = 'default') {
  const channelName = `notifications-${context}-${profileId}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${profileId}`,
      },
      (payload) => {
        onChange(payload);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/** Create a notification (internal use) */
export async function createNotification({ profileId, title, content, type = 'system' }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ profile_id: profileId, title, content, type })
    .select()
    .single();
  return { data, error };
}

/** Create a notification with an optional deep-link URL */
export async function createNotificationWithLink({
  profileId,
  title,
  content,
  type = 'system',
  linkUrl = null,
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ profile_id: profileId, title, content, type, link_url: linkUrl })
    .select()
    .single();
  return { data, error };
}

/** Fetch a small set of recent notifications (for bell popover) */
export async function getRecentNotifications(profileId, { limit = 5 } = {}) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, content, type, is_read, link_url, created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}
