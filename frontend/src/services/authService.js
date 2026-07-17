import { supabase } from '@/services/supabase';

/* ============================================================
   Helper: ensure the Supabase client has a valid token.
   refreshSession() only refreshes the token server-side.
   setSession() updates the client-side auth state so that
   subsequent storage/DB calls use the fresh token.
   ============================================================ */
async function ensureFreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (!error && data?.session) {
    // Push the new token into the client so storage calls pick it up
    await supabase.auth.setSession(data.session.access_token);
  }
  return !error;
}

/* -------- Auth primitives -------- */

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signUp({ email, password, fullName, studentCode }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, student_code: studentCode },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

/* -------- Profile -------- */

export async function getCurrentProfile() {
  await ensureFreshSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `id, full_name, student_code, email, avatar_url, faculty, major, phone, status,
       role_id,
       roles:role_id ( name )`
    )
    .eq('id', user.id)
    .maybeSingle();

  if (error) return null;

  if (data && data.roles) {
    data.role_name = data.roles.name ?? null;
    delete data.roles;
  }
  return data;
}

/* -------- Password Reset -------- */

export async function forgotPassword({ email }) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
}

/**
 * Verify the current password by attempting to re-authenticate.
 * Supabase's updateUser() doesn't require the current password, so we
 * sign in with email + current password to confirm ownership.
 */
export async function verifyCurrentPassword({ email, currentPassword }) {
  if (!email || !currentPassword) {
    throw new Error('Thiếu email hoặc mật khẩu hiện tại.');
  }
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (error) {
    // Friendly Vietnamese messages
    const m = (error.message || '').toLowerCase();
    if (m.includes('invalid') || m.includes('credentials')) {
      throw new Error('Mật khẩu hiện tại không đúng.');
    }
    throw new Error(error.message);
  }
  return true;
}

export async function updatePassword({ newPassword }) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

/**
 * Convenience: change password with verification of the old one.
 * Steps: verify current → update to new → ensure session refreshed.
 */
export async function changePassword({ email, currentPassword, newPassword }) {
  await verifyCurrentPassword({ email, currentPassword });
  await updatePassword({ newPassword });
  return true;
}

/**
 * Delete the current user's account.
 *
 * Strategy (client-safe, no service-role key required):
 *   1. Soft-delete the profile row (status='deleted', email anonymized).
 *      This cascades through FKs that reference profiles.
 *   2. Sign the user out.
 *
 * True auth.users deletion requires the Supabase admin API (service role key),
 * which must NEVER be exposed in the browser. If you need hard delete, run a
 * Supabase Edge Function with the service role to call admin.deleteUser().
 */
export async function deleteOwnAccount() {
  await ensureFreshSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'deleted',
      email: `deleted_${user.id}@removed.local`,
      full_name: 'Deleted User',
      student_code: null,
      avatar_url: null,
      phone: null,
      faculty: null,
      major: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw new Error(error.message);

  await supabase.auth.signOut();
  return true;
}

/* -------- Profile Updates -------- */

export async function updateProfile({ fullName, studentCode, faculty, major, phone }) {
  const fresh = await ensureFreshSession();
  if (!fresh) throw new Error('Không thể làm mới phiên. Vui lòng đăng nhập lại.');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      student_code: studentCode,
      faculty,
      major,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Upload avatar: ensure fresh token → upload to storage → update profiles.avatar_url.
 */
export async function updateAvatar({ file }) {
  const fresh = await ensureFreshSession();
  if (!fresh) throw new Error('Không thể làm mới phiên. Vui lòng đăng nhập lại.');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
  const fileName = `${user.id}/avatar.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  const contentType = mimeMap[fileExt] || 'image/png';

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { contentType, upsert: true });

  if (uploadError) {
    console.error('[updateAvatar] storage upload failed:', uploadError);
    const msg = uploadError.message || '';
    if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('violates row-level')) {
      throw new Error('Không có quyền tải lên ảnh. Vui lòng đăng nhập lại và thử again.');
    }
    throw new Error(`Tải ảnh thất bại: ${msg}`);
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAvatar() {
  const fresh = await ensureFreshSession();
  if (!fresh) throw new Error('Không thể làm mới phiên. Vui lòng đăng nhập lại.');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.storage
    .from('avatars')
    .remove([
      `${user.id}/avatar.png`, `${user.id}/avatar.jpg`,
      `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`, `${user.id}/avatar.gif`,
    ])
    .catch(() => null);

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/* -------- Auth change subscription -------- */

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => data.subscription.unsubscribe();
}

/* -------- Membership helper -------- */

export async function getMyMemberships(profileId) {
  if (!profileId) return [];
  const { data, error } = await supabase
    .from('memberships')
    .select(`
      id, position, status, joined_at,
      clubs ( id, name, logo_url, slug )
    `)
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false });
  if (error) return [];
  return data || [];
}
