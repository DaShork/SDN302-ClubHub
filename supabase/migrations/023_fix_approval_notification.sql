-- =============================================================================
-- 023_fix_approval_notification.sql
-- Hotfix for migration 022:
--   The `send_approval_notification` function referenced a non-existent column
--   `profile_id` on the `public.profiles` table (the PK is `id`). That broke
--   the AFTER-INSERT trigger on events/workshops and caused Supabase to
--   reject POST /rest/v1/events with HTTP 400 (column "profile_id" does not
--   exist).
--
-- Run this in the Supabase SQL Editor on the live project. It is idempotent.
-- =============================================================================

-- ── 1. Recreate send_approval_notification with the correct column name ─────
CREATE OR REPLACE FUNCTION public.send_approval_notification(
  p_item_type     TEXT,
  p_item_id       UUID,
  p_action        TEXT,
  p_approver_role TEXT,
  p_performed_by  UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_title  TEXT;
  v_club_id     UUID;
  v_leader_id   UUID;
  v_club_name   TEXT;
  v_notif_title TEXT;
  v_notif_body  TEXT;
  v_target_ids  UUID[];
BEGIN
  -- Resolve the item that was submitted / approved / rejected.
  IF p_item_type = 'event' THEN
    SELECT title, club_id, created_by
      INTO v_item_title, v_club_id, v_leader_id
      FROM public.events
     WHERE id = p_item_id;
  ELSIF p_item_type = 'workshop' THEN
    SELECT title, club_id, created_by
      INTO v_item_title, v_club_id, v_leader_id
      FROM public.workshops
     WHERE id = p_item_id;
  END IF;

  SELECT name INTO v_club_name FROM public.clubs WHERE id = v_club_id;

  -- Pick recipients + message body for each action.
  IF p_action = 'submit' THEN
    v_notif_title := 'Yêu cầu phê duyệt: ' || v_item_title;
    v_notif_body  := 'CLB ' || v_club_name || ' vừa nộp "' || v_item_title ||
                     '" chờ bạn phê duyệt.';
    SELECT array_agg(id)
      INTO v_target_ids
      FROM public.profiles
     WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Mentor');

  ELSIF p_action = 'approve' THEN
    IF p_approver_role = 'mentor' THEN
      v_notif_title := 'Yêu cầu phê duyệt: ' || v_item_title;
      v_notif_body  := 'Mentor đã phê duyệt "' || v_item_title ||
                       '" của CLB ' || v_club_name || '. Chờ bạn phê duyệt cuối cùng.';
      SELECT array_agg(id)
        INTO v_target_ids
        FROM public.profiles
       WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Manager');
    ELSE
      v_notif_title := 'Đã phê duyệt: ' || v_item_title;
      v_notif_body  := '"' || v_item_title || '" của CLB ' || v_club_name ||
                       ' đã được phê duyệt và hiển thị công khai!';
      v_target_ids := ARRAY[v_leader_id];
    END IF;

  ELSIF p_action = 'reject' THEN
    v_notif_title := 'Từ chối: ' || v_item_title;
    v_notif_body  := '"' || v_item_title || '" của CLB ' || v_club_name ||
                     ' đã bị từ chối bởi ' || p_approver_role || '.';
    v_target_ids := ARRAY[v_leader_id];
  END IF;

  IF v_target_ids IS NOT NULL THEN
    INSERT INTO public.notifications (profile_id, title, content, type)
    SELECT unnest(v_target_ids), v_notif_title, v_notif_body, 'approval';
  END IF;
END;
$$;

-- ── 2. Ensure approval_status columns exist (no-op if migration 022 ran) ───
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending_mentor'
    CHECK (approval_status IN (
      'pending_mentor','pending_manager','approved','rejected'
    )),
  ADD COLUMN IF NOT EXISTS rejected_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mentor_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending_mentor'
    CHECK (approval_status IN (
      'pending_mentor','pending_manager','approved','rejected'
    )),
  ADD COLUMN IF NOT EXISTS rejected_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mentor_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_approval_status    ON public.events(approval_status);
CREATE INDEX IF NOT EXISTS idx_workshops_approval_status ON public.workshops(approval_status);