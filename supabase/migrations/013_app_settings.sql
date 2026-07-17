-- ============================================================================
-- ClubHub: Platform Settings
-- Version: 1.0
--
-- A generic key/value store for runtime-configurable platform settings
-- (app name, contact email, feature flags, recruitment window, etc.).
-- Single-row-per-key design with JSONB value for flexibility.
--
-- Why JSONB value:
--   - Avoids migrations every time we add a new setting.
--   - Lets the UI send/receive structured data (e.g. recruitment start+end).
--   - pgcrypto/JSONB ops are well-indexed by default.
--
-- All writes are auto-logged into `audit_log` via trigger.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read settings (the app shows them as text).
CREATE POLICY "App settings are readable by authenticated users"
  ON public.app_settings FOR SELECT TO authenticated USING (true);

-- Only Administrators can write.
CREATE POLICY "Only admin can manage settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role('Administrator'))
  WITH CHECK (public.has_role('Administrator'));

-- ----------------------------------------------------------------
-- Trigger: update updated_at + log to audit_log
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_app_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.value IS DISTINCT FROM NEW.value THEN
    INSERT INTO public.audit_log (actor_id, action, target_table, target_id, details)
    VALUES (
      auth.uid(),
      'setting_changed',
      'app_settings',
      NULL,
      jsonb_build_object('key', NEW.key, 'old', OLD.value, 'new', NEW.value)
    );
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_app_settings ON public.app_settings;
CREATE TRIGGER trg_log_app_settings
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_app_settings_changes();

-- ----------------------------------------------------------------
-- Seed default settings (idempotent via ON CONFLICT)
-- ----------------------------------------------------------------
-- All string literals here contain apostrophes (Vietnamese: vui lòng, bạn, Hãy…).
-- In standard SQL string syntax we escape a single quote as ''.
-- We also wrap the JSON payload in E'...' for forward-compatibility if we
-- later add backslash sequences; inside E'…' the same '' rule applies.
INSERT INTO public.app_settings (key, value, description) VALUES
  ('general.app_name',         '"ClubHub FPTU"',                       'Tên hiển thị của nền tảng'),
  ('general.contact_email',    '"support@clubhub.fpt.edu.vn"',          'Email liên hệ chính'),
  ('general.tagline',          '"Quản lý CLB tập trung, kết nối sinh viên"', 'Khẩu hiệu ngắn'),
  ('general.support_phone',    '"+84 28 7300 5588"',                    'Số hotline hỗ trợ'),

  ('recruitment.current_term', '"Spring 2026"',                        'Kỳ hiện tại đang tuyển'),
  ('recruitment.start_date',   '"2026-02-01"',                         'Ngày bắt đầu đợt tuyển'),
  ('recruitment.end_date',     '"2026-04-30"',                         'Ngày kết thúc đợt tuyển'),
  ('recruitment.banner_text',  '"Các CLB đang mở tuyển thành viên mới!"',  'Thông báo hiển thị trên trang chủ'),

  ('features.enable_ai',           'true',  'Bật/tắt AI Assistant'),
  ('features.enable_gallery',      'true',  'Bật/tắt Gallery CLB'),
  ('features.enable_alumni',       'true',  'Bật/tắt Alumni Directory'),
  ('features.enable_payment',      'true',  'Bật/tắt Sandbox Payment'),
  ('features.allow_signup',        'true',  'Cho phép đăng ký tài khoản mới'),
  ('features.maintenance_mode',    'false', 'Bật chế độ bảo trì (chặn truy cập)'),
  ('features.maintenance_message', '"Hệ thống đang bảo trì, vui lòng quay lại sau."', 'Thông báo bảo trì'),

  ('email.welcome_subject',  '"Chào mừng bạn đến với ClubHub FPTU!"',  'Tiêu đề email chào mới'),
  ('email.welcome_body',     '"Cảm ơn bạn đã tham gia ClubHub. Hãy khám phá các CLB và đăng ký thành viên."',  'Nội dung email chào'),
  ('email.password_reset_subject', '"Đặt lại mật khẩu ClubHub"',  'Tiêu đề email reset password'),
  ('email.from_address',    '"noreply@clubhub.fpt.edu.vn"',          'Địa chỉ gửi email')
ON CONFLICT (key) DO NOTHING;

-- Verify
-- SELECT key, value FROM public.app_settings ORDER BY key;