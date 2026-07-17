-- =============================================================================
-- 014_recruitment_event_requests.sql
-- Adds tables required by joinRequestService + missing columns referenced by
-- eventService.joinRequestService, so the public Recruitment and Event
-- Registration flows can persist real data once USE_MOCK_FALLBACK is off.
-- Idempotent: every statement guards against re-execution.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. join_requests — recruitment workflow for clubs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.join_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            VARCHAR(20) NOT NULL DEFAULT 'club'
                    CHECK (type IN ('club', 'event')),
  event_id        UUID REFERENCES public.events(id) ON DELETE CASCADE,
  full_name       VARCHAR(255),
  student_code    VARCHAR(50),
  email           VARCHAR(255),
  phone           VARCHAR(20),
  motivation      TEXT,
  notes           TEXT,
  rejection_reason TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_join_requests_club_id
  ON public.join_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_profile_id
  ON public.join_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_event_id
  ON public.join_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status
  ON public.join_requests(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_club_status
  ON public.join_requests(club_id, status);

-- updated_at trigger reuses the helper from 003_triggers.sql when present;
-- fall back to an inline trigger if the helper is missing.
-- The inner function body uses $func$ to avoid colliding with the
-- outer DO-block $$ delimiter (Postgres treats BEGIN/END inside a DO
-- block as a statement separator unless the body is its own PL/pgSQL
-- function with a different dollar-quote tag).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_join_requests_updated_at ON public.join_requests;
CREATE TRIGGER trg_join_requests_updated_at
  BEFORE UPDATE ON public.join_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. RLS for join_requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS join_requests_select_own_or_leader ON public.join_requests;
CREATE POLICY join_requests_select_own_or_leader
  ON public.join_requests FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.profile_id = auth.uid()
        AND m.club_id = join_requests.club_id
        AND m.status = 'active'
        AND m.position IN ('President', 'Club Leader', 'Vice President')
    )
    OR public.has_role('Administrator')
    OR public.has_role('Manager')
  );

DROP POLICY IF EXISTS join_requests_insert_self ON public.join_requests;
CREATE POLICY join_requests_insert_self
  ON public.join_requests FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS join_requests_update_leader ON public.join_requests;
CREATE POLICY join_requests_update_leader
  ON public.join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.profile_id = auth.uid()
        AND m.club_id = join_requests.club_id
        AND m.status = 'active'
        AND m.position IN ('President', 'Club Leader', 'Vice President')
    )
    OR public.has_role('Administrator')
    OR public.has_role('Manager')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.profile_id = auth.uid()
        AND m.club_id = join_requests.club_id
        AND m.status = 'active'
        AND m.position IN ('President', 'Club Leader', 'Vice President')
    )
    OR public.has_role('Administrator')
    OR public.has_role('Manager')
  );

-- ---------------------------------------------------------------------------
-- 3. event_registrations — missing columns used by eventService
--    (qr_code, checked_in_at)
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS qr_code TEXT,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 4. events — cover_image_url (optional, falls back to banner_url if absent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- ---------------------------------------------------------------------------
-- 5. memberships — prevent duplicate active rows per (club_id, profile_id)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_memberships_club_profile'
  ) THEN
    ALTER TABLE public.memberships
      ADD CONSTRAINT uq_memberships_club_profile UNIQUE (club_id, profile_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. updated_at trigger for event_registrations (idempotent)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER trg_event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();