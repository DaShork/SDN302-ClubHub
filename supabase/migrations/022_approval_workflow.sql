-- =============================================================================
-- 022_approval_workflow.sql
-- Multi-stage approval for events and workshops:
--   Club Leader creates → Mentor approves → Manager approves → Public
--   Rejection at any stage marks the item as rejected (Leader notified).
--   Only approved items appear on public /events, /announcements pages.
--
-- Approvals flow in order: MENTOR → MANAGER
-- =============================================================================

-- ── 1. Extend events table with approval fields ──────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending_mentor'
    CHECK (approval_status IN (
      'pending_mentor','pending_manager','approved','rejected'
    )),
  ADD COLUMN IF NOT EXISTS rejected_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mentor_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Only leaders see pending items; approved items are public
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON public.events(approval_status);

-- ── 2. Extend workshops table ─────────────────────────────────────────────────
ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending_mentor'
    CHECK (approval_status IN (
      'pending_mentor','pending_manager','approved','rejected'
    )),
  ADD COLUMN IF NOT EXISTS rejected_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mentor_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workshops_approval_status ON public.workshops(approval_status);

-- ── 3. Approvals log (immutable audit trail) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.approval_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type      VARCHAR(20)  NOT NULL CHECK (item_type IN ('event','workshop','announcement')),
  item_id        UUID         NOT NULL,
  action         VARCHAR(20)  NOT NULL CHECK (action    IN ('submit','approve','reject')),
  performed_by   UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approver_role  VARCHAR(30)  NOT NULL CHECK (approver_role IN ('leader','mentor','manager')),
  comment        TEXT,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_logs_item     ON public.approval_logs(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_approval_logs_performer ON public.approval_logs(performed_by);

-- ── 4. RLS for approval_logs ──────────────────────────────────────────────────
ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;

-- Leader who created the item can see its log
CREATE POLICY "leader_approval_logs_read"
  ON public.approval_logs
  FOR SELECT
  USING (
    performed_by = auth.uid()
    OR
    (item_type = 'event' AND item_id IN (
      SELECT id FROM public.events
      WHERE created_by = auth.uid()
    ))
    OR
    (item_type = 'workshop' AND item_id IN (
      SELECT id FROM public.workshops
      WHERE created_by = auth.uid()
    ))
  );

-- Authenticated users can insert log entries
CREATE POLICY "authenticated_insert_approval_log"
  ON public.approval_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ── 5. Updated RLS for events (only approved = public) ────────────────────────
-- Drop the old public read policy and replace with approval-aware one
DROP POLICY IF EXISTS "public_read_events" ON public.events;

CREATE POLICY "approved_events_public_read"
  ON public.events
  FOR SELECT
  USING (
    -- Everyone can read approved events
    approval_status = 'approved'
    -- Leaders can read their own events in any status
    OR created_by = auth.uid()
    -- Mentors can read events pending_mentor and above
    OR (
      approval_status IN ('pending_mentor','pending_manager','approved')
      AND auth.uid() IN (
        SELECT m.profile_id FROM public.memberships m
        JOIN public.profiles p ON p.id = m.profile_id
        WHERE p.role_id = (SELECT id FROM public.roles WHERE name = 'Mentor')
      )
    )
  );

-- Service role bypass
CREATE POLICY "service_role_all_events"
  ON public.events
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── 6. Updated RLS for workshops ──────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_workshops" ON public.workshops;

CREATE POLICY "approved_workshops_public_read"
  ON public.workshops
  FOR SELECT
  USING (
    approval_status = 'approved'
    OR created_by = auth.uid()
  );

CREATE POLICY "service_role_all_workshops"
  ON public.workshops
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── 7. Helper function: get next approver role ─────────────────────────────────
-- Returns 'mentor', 'manager', or NULL based on current approval_status
CREATE OR REPLACE FUNCTION public.get_next_approver_role(approval_status VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF approval_status = 'pending_mentor' THEN RETURN 'mentor';
  ELSIF approval_status = 'pending_manager' THEN RETURN 'manager';
  ELSE RETURN NULL;
  END IF;
END;
$$;

-- ── 8. Helper: send approval notification ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_approval_notification(
  p_item_type   TEXT,
  p_item_id     UUID,
  p_action      TEXT,
  p_approver_role TEXT,
  p_performed_by UUID
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item_title TEXT;
  v_club_id    UUID;
  v_leader_id  UUID;
  v_club_name  TEXT;
  v_notif_title TEXT;
  v_notif_body  TEXT;
  v_target_ids  UUID[];
BEGIN
  -- Get item details
  IF p_item_type = 'event' THEN
    SELECT title, club_id, created_by INTO v_item_title, v_club_id, v_leader_id
    FROM public.events WHERE id = p_item_id;
  ELSIF p_item_type = 'workshop' THEN
    SELECT title, club_id, created_by INTO v_item_title, v_club_id, v_leader_id
    FROM public.workshops WHERE id = p_item_id;
  END IF;

  SELECT name INTO v_club_name FROM public.clubs WHERE id = v_club_id;

  -- Determine notification targets and content
  IF p_action = 'submit' THEN
    -- Notify mentors
    v_notif_title := 'Yêu cầu phê duyệt: ' || v_item_title;
    v_notif_body  := 'CLB ' || v_club_name || ' vừa nộp "' || v_item_title ||
                     '" chờ bạn phê duyệt.';
    SELECT array_agg(id)
      INTO v_target_ids
      FROM public.profiles
      WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Mentor');

  ELSIF p_action = 'approve' THEN
    IF p_approver_role = 'mentor' THEN
      -- Notify managers
      v_notif_title := 'Yêu cầu phê duyệt: ' || v_item_title;
      v_notif_body  := 'Mentor đã phê duyệt "' || v_item_title ||
                       '" của CLB ' || v_club_name || '. Chờ bạn phê duyệt cuối cùng.';
      SELECT array_agg(id)
        INTO v_target_ids
        FROM public.profiles
        WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Manager');
    ELSE
      -- Notify leader: approved!
      v_notif_title := 'Đã phê duyệt: ' || v_item_title;
      v_notif_body  := '"' || v_item_title || '" của CLB ' || v_club_name ||
                       ' đã được phê duyệt và hiển thị công khai!';
      v_target_ids := ARRAY[v_leader_id];
    END IF;

  ELSIF p_action = 'reject' THEN
    -- Notify leader
    v_notif_title := 'Từ chối: ' || v_item_title;
    v_notif_body  := '"' || v_item_title || '" của CLB ' || v_club_name ||
                     ' đã bị từ chối bởi ' || p_approver_role || '.';
    v_target_ids := ARRAY[v_leader_id];
  END IF;

  -- Insert notifications
  IF v_target_ids IS NOT NULL THEN
    INSERT INTO public.notifications (profile_id, title, content, type)
    SELECT unnest(v_target_ids), v_notif_title, v_notif_body, 'approval';
  END IF;
END;
$$;

-- ── 9. Trigger: auto-submit on event creation ──────────────────────────────────
-- New events start at pending_mentor (already the default)
-- This trigger just logs the submission
CREATE OR REPLACE FUNCTION public.log_event_submission()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.approval_status = 'pending_mentor' AND TG_OP = 'INSERT' THEN
    PERFORM public.send_approval_notification(
      'event', NEW.id, 'submit', 'leader', NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_event_submission ON public.events;
CREATE TRIGGER trg_log_event_submission
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.log_event_submission();

-- ── 10. Trigger: auto-submit on workshop creation ──────────────────────────────
CREATE OR REPLACE FUNCTION public.log_workshop_submission()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.approval_status = 'pending_mentor' AND TG_OP = 'INSERT' THEN
    PERFORM public.send_approval_notification(
      'workshop', NEW.id, 'submit', 'leader', NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_workshop_submission ON public.workshops;
CREATE TRIGGER trg_log_workshop_submission
  AFTER INSERT ON public.workshops
  FOR EACH ROW EXECUTE FUNCTION public.log_workshop_submission();
