-- =============================================================================
-- 020_auto_upgrade_member_role.sql
-- Auto-upgrade profile.role_id to 'Club Member' when user gets their first
-- active membership in any club.
--
-- This complements the frontend-side role upgrade in joinRequestService.js.
-- The trigger fires on INSERT into memberships (status='active') and upgrades
-- the user's role only if they currently hold 'Student' or have no elevated
-- role yet.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper function (idempotent — safe to re-run)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upgrade_to_club_member()
RETURNS TRIGGER AS $$
DECLARE
  student_role_uuid UUID;
  club_member_role_uuid UUID;
  current_role_name TEXT;
BEGIN
  -- Only trigger on INSERT of active membership
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Skip if already a leader/mentor/manager/admin
    SELECT r.name INTO current_role_name
    FROM public.profiles p
    JOIN public.roles r ON r.id = p.role_id
    WHERE p.id = NEW.profile_id;

    IF current_role_name IN ('Club Leader', 'Club Member', 'Mentor', 'Manager', 'Administrator') THEN
      RETURN NEW; -- already elevated, do nothing
    END IF;

    -- Get role UUIDs
    SELECT id INTO student_role_uuid FROM public.roles WHERE name = 'Student' LIMIT 1;
    SELECT id INTO club_member_role_uuid FROM public.roles WHERE name = 'Club Member' LIMIT 1;

    -- Upgrade: Student -> Club Member
    IF club_member_role_uuid IS NOT NULL THEN
      UPDATE public.profiles
      SET role_id = club_member_role_uuid,
          updated_at = NOW()
      WHERE id = NEW.profile_id
        AND (role_id = student_role_uuid OR role_id IS NULL);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 2. Trigger on memberships (fires after INSERT)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_upgrade_member_role ON public.memberships;
CREATE TRIGGER trg_upgrade_member_role
  AFTER INSERT ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.upgrade_to_club_member();
