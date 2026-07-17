-- =============================================================================
-- 024_event_registration_unification.sql
-- Hợp nhất luồng event_requests + event_registrations để sửa 3 vấn đề:
--   1. Member bị "tính nhầm" đã đăng ký khi create event (thiếu row bảng A).
--   2. Sau khi gửi event_requests, member không thấy trong MyRegistrations
--      vì hai bảng không sync.
--   3. Thiếu chức năng cancel request ở bảng B.
--
-- Cách hợp nhất: KHI STUDENT GỬI event_requests với status='approved'
-- (tự động nếu event không yêu cầu duyệt) thì trigger DB tạo/sync row
-- event_registrations tương ứng. status thay đổi trên 1 bảng → mirror
-- sang bảng còn lại.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Đảm bảo bảng event_requests tồn tại (service đang đọc/ghi từ nó,
--    migration 014 chỉ tạo join_requests nhưng chưa có bảng này).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  club_id          UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  profile_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name        VARCHAR(255),
  student_code     VARCHAR(50),
  email            VARCHAR(255),
  phone            VARCHAR(20),
  notes            TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected','cancelled')),
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_requests_event_id   ON public.event_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_profile_id ON public.event_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_status     ON public.event_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_requests_event_profile
  ON public.event_requests(event_id, profile_id);

-- updated_at trigger (helper function reuse from 014 or 003).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $f$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $f$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_event_requests_updated_at ON public.event_requests;
CREATE TRIGGER trg_event_requests_updated_at
  BEFORE UPDATE ON public.event_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Mở rộng CHECK status của event_registrations để chứa 'pending'
--    và 'checked_in' (nếu schema cũ chỉ cho 'registered'/'cancelled').
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_status_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_registrations_status_check'
  ) THEN
    ALTER TABLE public.event_registrations
      ADD CONSTRAINT event_registrations_status_check
      CHECK (status IN ('pending','registered','cancelled','checked_in'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Trigger A: INSERT/UPDATE trên event_requests → mirror sang
--    event_registrations. Mapping:
--      approved → registered
--      rejected / cancelled → cancelled
--      pending  → pending (user đã gửi, chờ duyệt)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_event_request_to_registration()
RETURNS trigger AS $$
DECLARE
  v_qr TEXT;
  v_status TEXT;
BEGIN
  IF NEW.status = 'approved' THEN
    v_status := 'registered';
  ELSIF NEW.status IN ('rejected','cancelled') THEN
    v_status := 'cancelled';
  ELSE
    v_status := 'pending';
  END IF;

  SELECT qr_code INTO v_qr
  FROM public.event_registrations
  WHERE event_id = NEW.event_id AND profile_id = NEW.profile_id;

  IF v_qr IS NULL THEN
    v_qr := 'CHB-' || substr(NEW.event_id::text, 1, 6)
              || '-' || upper(substr(md5(random()::text), 1, 6));
  END IF;

  INSERT INTO public.event_registrations
    (event_id, profile_id, status, qr_code, registered_at)
  VALUES
    (NEW.event_id, NEW.profile_id, v_status, v_qr, NOW())
  ON CONFLICT (event_id, profile_id) DO UPDATE
    SET status = EXCLUDED.status,
        updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_event_request ON public.event_requests;
CREATE TRIGGER trg_sync_event_request
  AFTER INSERT OR UPDATE OF status ON public.event_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_event_request_to_registration();

-- ---------------------------------------------------------------------------
-- 4. Trigger B: UPDATE event_registrations → nếu bị cancel, mirror sang
--    event_requests để 2 bảng luôn đồng bộ.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_event_registration_cancellation()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'cancelled'
     AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    UPDATE public.event_requests
      SET status = 'cancelled', updated_at = NOW()
      WHERE event_id = NEW.event_id
        AND profile_id = NEW.profile_id
        AND status <> 'cancelled';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_event_reg_cancel ON public.event_registrations;
CREATE TRIGGER trg_sync_event_reg_cancel
  AFTER UPDATE OF status ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_event_registration_cancellation();

-- ---------------------------------------------------------------------------
-- 5. Cột cấu hình mới trên events:
--    requires_approval  : bật/tắt leader duyệt trước khi đăng ký thành công.
--    auto_register_creator : leader muốn auto-register chính mình khi tạo.
-- ---------------------------------------------------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS requires_approval     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_register_creator BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------------------
-- 6. Indexes để query nhanh
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_event_registrations_profile_status
  ON public.event_registrations (profile_id, status);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_status
  ON public.event_registrations (event_id, status);

-- ---------------------------------------------------------------------------
-- 6b. Đảm bảo cột updated_at tồn tại trên event_registrations.
--     Schema gốc (001_schema.sql) chỉ có registered_at; trigger UPSERT +
--     backfill phía dưới cần updated_at. Migration 014 đã thêm qr_code +
--     checked_in_at nhưng KHÔNG thêm updated_at — đây là gap cần vá.
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Belt-and-braces: nếu migration 014 chưa chạy và helper function chưa
-- tồn tại, định nghĩa nó ở đây để trigger ở dưới không fail.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $f$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $f$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Trigger để tự set updated_at = NOW() khi row được UPDATE.
-- INSERT đã có default NOW() từ DEFAULT clause ở trên.
-- Migration 014 đã tạo trigger trg_event_registrations_updated_at nên
-- chỉ cần đảm bảo nó tồn tại; idempotent DROP IF EXISTS + CREATE.
DROP TRIGGER IF EXISTS trg_event_registrations_updated_at
  ON public.event_registrations;
CREATE TRIGGER trg_event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Backfill: copy mọi event_request hiện có sang event_registrations
--    (idempotent).
-- ---------------------------------------------------------------------------
INSERT INTO public.event_registrations
  (event_id, profile_id, status, qr_code, registered_at)
SELECT er.event_id,
       er.profile_id,
       CASE WHEN er.status = 'approved' THEN 'registered'
            WHEN er.status IN ('rejected','cancelled') THEN 'cancelled'
            ELSE 'pending' END,
       'CHB-' || substr(er.event_id::text, 1, 6) || '-' || upper(substr(md5(random()::text), 1, 6)),
       COALESCE(er.created_at, NOW())
FROM public.event_requests er
WHERE er.event_id IS NOT NULL
ON CONFLICT (event_id, profile_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. RLS updates: cho phép member self-cancel + self-read.
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;

-- ── Leader/mentor có thể xem event_requests của club mình ──────────────
DROP POLICY IF EXISTS "event_requests_club_leaders_read" ON public.event_requests;
CREATE POLICY "event_requests_club_leaders_read"
  ON public.event_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.profile_id = auth.uid()
        AND m.club_id = event_requests.club_id
        AND m.status = 'active'
        AND m.position IN ('President', 'Club Leader', 'Vice President', 'Mentor')
    )
    OR public.has_role('Administrator')
    OR public.has_role('Manager')
  );

DROP POLICY IF EXISTS "event_requests_self_read" ON public.event_requests;
CREATE POLICY "event_requests_self_read"
  ON public.event_requests FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_requests.event_id
        AND e.club_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.profile_id = auth.uid()
            AND m.club_id = e.club_id
            AND m.status = 'active'
        )
    )
  );

DROP POLICY IF EXISTS "event_requests_self_cancel" ON public.event_requests;
CREATE POLICY "event_requests_self_cancel"
  ON public.event_requests FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "event_requests_self_insert" ON public.event_requests;
CREATE POLICY "event_requests_self_insert"
  ON public.event_requests FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Member có thể UPDATE event_registrations của chính họ (để soft-cancel).
DROP POLICY IF EXISTS "event_registrations_self_cancel" ON public.event_registrations;
CREATE POLICY "event_registrations_self_cancel"
  ON public.event_registrations FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Member có thể SELECT registration của chính họ, hoặc của CLB mình active.
DROP POLICY IF EXISTS "event_registrations_self_read" ON public.event_registrations;
CREATE POLICY "event_registrations_self_read"
  ON public.event_registrations FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_registrations.event_id
        AND e.club_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.profile_id = auth.uid()
            AND m.club_id = e.club_id
            AND m.status = 'active'
        )
    )
  );
