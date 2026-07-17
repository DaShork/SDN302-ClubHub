-- ============================================================================
-- ClubHub Storage + RLS Fix
-- Version: 1.1
-- Purpose:
--   1. Fix storage bucket: ensure avatars is public
--   2. Fix memberships SELECT policy: replace is_club_member() with direct
--      EXISTS subquery to avoid Supabase RLS recursion limitation
--   3. Add explicit storage policies for avatars (idempotent — safe to re-run)
--
-- HOW TO RUN:
--   Copy the entire content below and paste it into:
--   Supabase Dashboard > SQL Editor > Run
-- ============================================================================

-- ---------------------------------------
-- 1. FIX: Ensure avatars bucket is public
-- ---------------------------------------
UPDATE storage.buckets
SET public = true, name = 'avatars'
WHERE id = 'avatars';

-- If the bucket row doesn't exist yet, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ---------------------------------------
-- 2. FIX: memberships SELECT policy
--    Replace is_club_member() helper with direct EXISTS
--    Supabase RLS has a recursion limit — helper functions that SELECT
--    from the same table being evaluated cause 400 errors.
-- ---------------------------------------

-- Drop old memberships SELECT policies
DROP POLICY IF EXISTS "Members can view own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Club leaders can manage memberships" ON public.memberships;

-- New: view own membership rows (no helper function recursion)
CREATE POLICY "Members can view own memberships" ON public.memberships
  FOR SELECT TO authenticated USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.club_id = public.memberships.club_id
        AND m2.profile_id = auth.uid()
        AND m2.status = 'active'
    )
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
    OR public.has_role('Mentor')
  );

-- Leaders can INSERT/UPDATE/DELETE memberships
CREATE POLICY "Club leaders can manage memberships" ON public.memberships
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.club_id = public.memberships.club_id
        AND m2.profile_id = auth.uid()
        AND m2.status = 'active'
        AND m2.position IN ('President', 'Vice President', 'Club Leader', 'Mentor')
    )
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.club_id = public.memberships.club_id
        AND m2.profile_id = auth.uid()
        AND m2.status = 'active'
        AND m2.position IN ('President', 'Vice President', 'Club Leader', 'Mentor')
    )
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ---------------------------------------
-- 3. RE-CREATE: Avatar storage policies
--    (Idempotent — safe to re-run even if they already exist)
-- ---------------------------------------

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Upload: folder name must match the user's UUID
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- View: anyone can read (bucket is public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Update: same folder = own file
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: same folder = own file
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------
-- 4. BONUS: Verify setup
-- ---------------------------------------
-- Run these to check your setup:
-- SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'memberships';
-- SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
