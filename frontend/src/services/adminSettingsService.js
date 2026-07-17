import { supabase } from '@/services/supabase';

/* ============================================================
   adminSettingsService
   ------------------------------------------------------------
   CRUD on the public.app_settings table. RLS restricts writes
   to Administrator; everyone authenticated can read.

   Settings are stored as JSONB (value column). The frontend
   defines the schema for each key (see adminSettingsSchema).
   ============================================================ */

/** Read all settings and group them by category. */
export async function getAllSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value, description, updated_by, updated_at, created_at')
    .order('key');

  if (error) throw error;
  return data || [];
}

/** Update one setting key. The migration 013 trigger logs to audit_log. */
export async function updateSetting(key, value) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('app_settings')
    .update({
      value,
      updated_by: user?.id,
    })
    .eq('key', key)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Update multiple settings at once. */
export async function updateSettings(patches) {
  // patches = [{ key, value }, ...]
  const { data: { user } } = await supabase.auth.getUser();
  const results = [];
  for (const p of patches) {
    const { data, error } = await supabase
      .from('app_settings')
      .update({ value: p.value, updated_by: user?.id })
      .eq('key', p.key)
      .select()
      .single();
    if (error) throw error;
    results.push(data);
  }
  return results;
}

/**
 * Decode a JSONB value coming from Postgres. The migrations store string
 * literals as JSON strings (e.g. '"hello"'); we unwrap them so callers
 * always get plain primitives.
 */
export function decodeValue(value) {
  if (value === null || value === undefined) return value;
  // Postgres returns text/varchar wrapped as JSON strings, booleans as raw booleans.
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'string' ? parsed : value;
    } catch {
      return value;
    }
  }
  return value;
}

/** Encode a JS value into the JSONB representation expected by Postgres. */
export function encodeValue(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  return JSON.stringify(value);
}

/* ---------- Schema metadata (UI side) ---------- */

/**
 * Defines what UI to render for each setting key. Categories are used for
 * tab grouping. Anything not listed here is rendered as a raw textarea.
 */
export const SETTINGS_SCHEMA = {
  /* General */
  'general.app_name':      { category: 'general', label: 'Tên ứng dụng',          type: 'text' },
  'general.tagline':       { category: 'general', label: 'Khẩu hiệu',             type: 'text' },
  'general.contact_email': { category: 'general', label: 'Email liên hệ',          type: 'email' },
  'general.support_phone': { category: 'general', label: 'Số hotline hỗ trợ',      type: 'tel' },

  /* Recruitment */
  'recruitment.current_term':  { category: 'recruitment', label: 'Kỳ hiện tại',         type: 'text' },
  'recruitment.start_date':    { category: 'recruitment', label: 'Ngày bắt đầu',         type: 'date' },
  'recruitment.end_date':      { category: 'recruitment', label: 'Ngày kết thúc',        type: 'date' },
  'recruitment.banner_text':   { category: 'recruitment', label: 'Thông báo trên trang chủ', type: 'textarea' },

  /* Feature flags */
  'features.enable_ai':        { category: 'features', label: 'AI Assistant',     type: 'boolean', danger: true },
  'features.enable_gallery':   { category: 'features', label: 'Gallery CLB',      type: 'boolean' },
  'features.enable_alumni':    { category: 'features', label: 'Alumni Directory', type: 'boolean' },
  'features.enable_payment':   { category: 'features', label: 'Sandbox Payment',  type: 'boolean', danger: true },
  'features.allow_signup':     { category: 'features', label: 'Cho phép đăng ký mới', type: 'boolean', danger: true },
  'features.maintenance_mode': { category: 'features', label: 'Chế độ bảo trì',  type: 'boolean', danger: true },
  'features.maintenance_message': { category: 'features', label: 'Thông báo bảo trì', type: 'textarea' },

  /* Email */
  'email.from_address':             { category: 'email', label: 'Địa chỉ gửi (From)',  type: 'email' },
  'email.welcome_subject':          { category: 'email', label: 'Tiêu đề email chào',   type: 'text' },
  'email.welcome_body':             { category: 'email', label: 'Nội dung email chào',  type: 'textarea' },
  'email.password_reset_subject':   { category: 'email', label: 'Tiêu đề email reset',  type: 'text' },
};

export const SETTINGS_CATEGORIES = [
  { id: 'general',     label: 'Thông tin chung',  description: 'Tên, khẩu hiệu, thông tin liên hệ của nền tảng' },
  { id: 'recruitment', label: 'Tuyển thành viên', description: 'Quản lý kỳ tuyển và thông báo' },
  { id: 'features',    label: 'Tính năng',        description: 'Bật / tắt các module trong hệ thống' },
  { id: 'email',       label: 'Email',            description: 'Template email tự động' },
];

/** Group a flat list of rows into a map keyed by category. */
export function groupByCategory(rows) {
  const out = {};
  for (const cat of SETTINGS_CATEGORIES) out[cat.id] = [];
  for (const row of rows) {
    const meta = SETTINGS_SCHEMA[row.key];
    const category = meta?.category || 'general';
    if (!out[category]) out[category] = [];
    out[category].push({ ...row, meta });
  }
  return out;
}