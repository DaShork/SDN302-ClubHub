-- ============================================================================
-- ClubHub: Add Club Leaders/Mentors FK + Club Meta Columns
-- Version: 1.1
--
-- Changes:
--   clubs table:
--     - leader_id      FK → profiles.id (direct link to the club's President)
--     - mentor_id      FK → profiles.id (direct link to the assigned Mentor)
--     - slug           UNIQUE TEXT (URL-friendly club name, e.g. "fpt-robotics")
--     - short_description TEXT (1-sentence tagline)
--     - member_count   INTEGER (denormalised for fast reads; updated via trigger)
--
--   memberships table:
--     - Auto-update clubs.member_count when members join/leave
--     - Auto-set clubs.leader_id when a member's position becomes President
--
--   View: v_clubs_with_leaders
--     JOINs clubs + profiles (as leader) + profiles (as mentor)
--     → use this instead of raw clubs table for frontend display
--
-- HOW TO RUN:
--   Supabase Dashboard > SQL Editor > paste entire content > Run
-- ============================================================================

-- -----------------------------------------------
-- 1. ADD COLUMNS TO CLUBS
-- -----------------------------------------------
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- Indexes for the new FK columns (fast lookups)
CREATE INDEX IF NOT EXISTS idx_clubs_leader ON public.clubs(leader_id);
CREATE INDEX IF NOT EXISTS idx_clubs_mentor ON public.clubs(mentor_id);
CREATE INDEX IF NOT EXISTS idx_clubs_slug  ON public.clubs(slug);

-- -----------------------------------------------
-- 2. AUTO-GENERATE SLUG FROM NAME (once, for existing rows)
-- -----------------------------------------------
UPDATE public.clubs
SET slug = LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '^-|-$', '', 'g'
    )
  )
WHERE slug IS NULL AND name IS NOT NULL;

-- Make slug NOT NULL for new inserts (but allow existing NULLs)
ALTER TABLE public.clubs
  ALTER COLUMN slug SET NOT NULL;

-- -----------------------------------------------
-- 3. VIEW: clubs + leader + mentor profile data
-- -----------------------------------------------
-- Usage: SELECT * FROM public.v_clubs_with_leaders WHERE id = 'some-uuid';
-- This view resolves the FK lookups so the frontend doesn't need multiple joins.
CREATE OR REPLACE VIEW public.v_clubs_with_leaders AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.short_description,
  c.description,
  c.logo_url,
  c.banner_url,
  c.contact_email,
  c.facebook_url,
  c.recruitment_status,
  c.founded_year,
  c.status,
  c.member_count,
  c.created_at,
  c.updated_at,

  -- Leader profile
  l_profile.id          AS leader_id,
  l_profile.full_name   AS leader_name,
  l_profile.student_code AS leader_student_code,
  l_profile.avatar_url  AS leader_avatar_url,
  l_profile.email       AS leader_email,

  -- Mentor profile
  m_profile.id          AS mentor_id,
  m_profile.full_name   AS mentor_name,
  m_profile.student_code AS mentor_student_code,
  m_profile.avatar_url   AS mentor_avatar_url,
  m_profile.email       AS mentor_email,

  -- Category
  cat.id   AS category_id,
  cat.name AS category_name
FROM public.clubs c
LEFT JOIN public.profiles l_profile ON c.leader_id = l_profile.id
LEFT JOIN public.profiles m_profile ON c.mentor_id = m_profile.id
LEFT JOIN public.categories cat ON c.category_id = cat.id;

-- -----------------------------------------------
-- 4. TRIGGER: sync member_count on membership changes
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clubs
    SET member_count = (
      SELECT COUNT(*) FROM public.memberships
      WHERE club_id = NEW.club_id AND status = 'active'
    )
    WHERE id = NEW.club_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clubs
    SET member_count = (
      SELECT COUNT(*) FROM public.memberships
      WHERE club_id = OLD.club_id AND status = 'active'
    )
    WHERE id = OLD.club_id;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Only re-count if the status changed (join/leave)
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      UPDATE public.clubs
      SET member_count = (
        SELECT COUNT(*) FROM public.memberships
        WHERE club_id = NEW.club_id AND status = 'active'
      )
      WHERE id = NEW.club_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_club_member_count ON public.memberships;
CREATE TRIGGER trg_sync_club_member_count
  AFTER INSERT OR UPDATE OR DELETE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.sync_club_member_count();

-- -----------------------------------------------
-- 5. TRIGGER: auto-set clubs.leader_id when member becomes President
-- -----------------------------------------------
-- When a membership row gets position = 'President' (or 'Club Leader'),
-- automatically update clubs.leader_id to point to that profile.
CREATE OR REPLACE FUNCTION public.sync_club_leader_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IN ('President', 'Club Leader')
     AND NEW.status = 'active'
     AND (OLD.position IS NULL OR OLD.position NOT IN ('President', 'Club Leader'))
  THEN
    UPDATE public.clubs SET leader_id = NEW.profile_id WHERE id = NEW.club_id;

  ELSIF (TG_OP = 'UPDATE')
     AND NEW.status != 'active'
     AND OLD.status = 'active'
     AND OLD.position IN ('President', 'Club Leader')
  THEN
    -- Leader left the club — clear the FK
    UPDATE public.clubs
    SET leader_id = NULL
    WHERE id = OLD.club_id AND leader_id = OLD.profile_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_club_leader_id ON public.memberships;
CREATE TRIGGER trg_sync_club_leader_id
  AFTER INSERT OR UPDATE OR DELETE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.sync_club_leader_id();

-- -----------------------------------------------
-- 6. BACKFILL: set leader_id from existing President memberships
-- -----------------------------------------------
UPDATE public.clubs c
SET leader_id = (
  SELECT m.profile_id
  FROM public.memberships m
  WHERE m.club_id = c.id
    AND m.position IN ('President', 'Club Leader')
    AND m.status = 'active'
  ORDER BY m.joined_at ASC
  LIMIT 1
)
WHERE c.leader_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.memberships m2
    WHERE m2.club_id = c.id
      AND m2.position IN ('President', 'Club Leader')
      AND m2.status = 'active'
  );

-- -----------------------------------------------
-- 7. BACKFILL: set member_count from current memberships
-- -----------------------------------------------
UPDATE public.clubs c
SET member_count = (
  SELECT COUNT(*)
  FROM public.memberships m
  WHERE m.club_id = c.id AND m.status = 'active'
);

-- -----------------------------------------------
-- 8. VERIFY — run these to check the result:
-- -----------------------------------------------
-- SELECT name, slug, member_count, leader_id FROM public.clubs LIMIT 10;
-- SELECT * FROM public.v_clubs_with_leaders LIMIT 10;
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'clubs';
