-- ============================================================================
-- ClubHub: Reverse Sync (clubs.leader_id -> memberships) + Backfill
-- Version: 1.0
--
-- Problem:
--   Migration 007 only syncs ONE WAY: memberships → clubs.leader_id
--   (i.e. when a member's position becomes 'President').
--   But if you set clubs.leader_id manually in Supabase Dashboard,
--   the memberships table has NO matching row, so MyClubsPage shows nothing
--   for that user.
--
-- This migration:
--   1. Adds a reverse trigger on clubs UPDATE → ensure memberships row exists
--      for the new leader with position='President', status='active'.
--   2. Backfills missing memberships for clubs that already have leader_id set.
--
-- HOW TO RUN:
--   Supabase Dashboard > SQL Editor > paste > Run
-- ============================================================================

-- -----------------------------------------------
-- 1. REVERSE TRIGGER: clubs.leader_id -> memberships
-- -----------------------------------------------
-- When clubs.leader_id changes (set to a new profile), automatically
-- ensure that profile has an active 'President' membership row.
-- When leader_id is cleared (NULL), mark that membership as 'left'.
-- Handles both INSERT (club created with leader_id) and UPDATE.
CREATE OR REPLACE FUNCTION public.sync_leader_id_to_memberships()
RETURNS TRIGGER AS $$
DECLARE
  existing_membership_id UUID;
  old_leader UUID;
BEGIN
  -- Capture old leader_id safely (NULL on INSERT)
  old_leader := OLD.leader_id;

  -- Skip if leader_id didn't change (also covers trivial no-op updates)
  IF old_leader IS NOT DISTINCT FROM NEW.leader_id THEN
    RETURN NEW;
  END IF;

  -- Case A: leader_id was cleared → mark old leader's membership as 'left'
  IF old_leader IS NOT NULL AND NEW.leader_id IS NULL THEN
    UPDATE public.memberships
    SET status = 'left',
        left_at = CURRENT_DATE,
        updated_at = NOW()
    WHERE profile_id = old_leader
      AND club_id = NEW.id
      AND status = 'active'
      AND position IN ('President', 'Club Leader');
  END IF;

  -- Case B: leader_id set/changed → ensure new leader has active 'President' row
  IF NEW.leader_id IS NOT NULL THEN
    -- Check if a membership row already exists for this profile+club (any status)
    SELECT id INTO existing_membership_id
    FROM public.memberships
    WHERE profile_id = NEW.leader_id
      AND club_id = NEW.id
    ORDER BY
      CASE WHEN status = 'active' THEN 0 ELSE 1 END,
      joined_at DESC
    LIMIT 1;

    IF existing_membership_id IS NOT NULL THEN
      -- Reactivate / promote existing row to 'President' / 'active'
      UPDATE public.memberships
      SET position = 'President',
          status = 'active',
          left_at = NULL,
          updated_at = NOW()
      WHERE id = existing_membership_id;
    ELSE
      -- Insert a fresh active President membership
      INSERT INTO public.memberships (club_id, profile_id, position, status, joined_at)
      VALUES (NEW.id, NEW.leader_id, 'President', 'active', CURRENT_DATE);
    END IF;

    -- If a previous leader is being replaced, demote them
    IF old_leader IS NOT NULL AND old_leader <> NEW.leader_id THEN
      UPDATE public.memberships
      SET status = 'left',
          left_at = CURRENT_DATE,
          updated_at = NOW()
      WHERE profile_id = old_leader
        AND club_id = NEW.id
        AND status = 'active'
        AND position IN ('President', 'Club Leader');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_leader_id_to_memberships ON public.clubs;
CREATE TRIGGER trg_sync_leader_id_to_memberships
  AFTER INSERT OR UPDATE OF leader_id ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.sync_leader_id_to_memberships();

-- -----------------------------------------------
-- 2. BACKFILL: create memberships for clubs that have leader_id but no row
-- -----------------------------------------------
DO $$
DECLARE
  rec RECORD;
  existing_id UUID;
BEGIN
  FOR rec IN
    SELECT c.id AS club_id, c.leader_id, c.name
    FROM public.clubs c
    WHERE c.leader_id IS NOT NULL
  LOOP
    -- Skip if this profile already has an active President row for this club
    SELECT id INTO existing_id
    FROM public.memberships
    WHERE profile_id = rec.leader_id
      AND club_id = rec.club_id
      AND status = 'active'
      AND position IN ('President', 'Club Leader')
    LIMIT 1;

    IF existing_id IS NULL THEN
      INSERT INTO public.memberships (club_id, profile_id, position, status, joined_at)
      VALUES (rec.club_id, rec.leader_id, 'President', 'active', CURRENT_DATE);

      RAISE NOTICE 'Backfilled membership for club "%" → leader %', rec.name, rec.leader_id;
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------
-- 3. RECOMPUTE member_count after backfill
-- -----------------------------------------------
UPDATE public.clubs c
SET member_count = (
  SELECT COUNT(*)
  FROM public.memberships m
  WHERE m.club_id = c.id AND m.status = 'active'
);

-- -----------------------------------------------
-- 4. VERIFY — run after migration to confirm
-- -----------------------------------------------
-- Compare clubs.leader_id vs memberships
-- SELECT c.name, c.leader_id, m.profile_id, m.position, m.status
-- FROM public.clubs c
-- LEFT JOIN public.memberships m
--   ON m.club_id = c.id
--  AND m.position IN ('President', 'Club Leader')
--  AND m.status = 'active'
-- WHERE c.leader_id IS NOT NULL;