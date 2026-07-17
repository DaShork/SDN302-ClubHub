import { supabase } from './supabase';

/**
 * Per-user notification preferences (email/push × events/clubs/announcements).
 * Stored in `public.notification_preferences` (one row per profile).
 */

export const DEFAULT_PREFS = {
  email_events: true,
  email_clubs: true,
  email_announcements: false,
  push_events: true,
  push_clubs: false,
  push_announcements: false,
};

export async function getPrefs(profileId) {
  if (!profileId) return { ...DEFAULT_PREFS };
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (error) {
    console.error('[notificationPrefs] getPrefs error:', error);
    return { ...DEFAULT_PREFS };
  }
  if (!data) return { ...DEFAULT_PREFS };
  const { profile_id, updated_at, ...rest } = data;
  return rest;
}

/**
 * Upsert using the user's profile_id from auth.
 * If no row exists, insert with defaults + overrides.
 */
export async function savePrefs(profileId, prefs) {
  if (!profileId) throw new Error('Missing profileId');
  const payload = {
    profile_id: profileId,
    email_events:      !!prefs.email_events,
    email_clubs:       !!prefs.email_clubs,
    email_announcements: !!prefs.email_announcements,
    push_events:       !!prefs.push_events,
    push_clubs:        !!prefs.push_clubs,
    push_announcements: !!prefs.push_announcements,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(payload, { onConflict: 'profile_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
