-- ============================================================================
-- Notifications: add link_url so notifications can deep-link to a page.
-- Version: 1.0
--
-- When a notification is created (e.g. "Yêu cầu tham gia CLB được duyệt"),
-- we can set link_url so the bell popover and notification list can navigate
-- the user directly to the relevant page.
--
-- Also add an optional rejection_reason field to join_requests so leaders
-- can record why a request was turned down (shown in the student notification).
--
-- How to run:
--   Supabase Dashboard > SQL Editor > paste entire content > Run
-- ============================================================================

-- 1. Add link_url to notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link_url TEXT;

COMMENT ON COLUMN public.notifications.link_url IS
  'Optional URL path to navigate to when clicking this notification (e.g. /member/clubs?club=uuid)';

-- 2. Add rejection_reason column to join_requests (already has the column per
--    migration 014, but ensure it exists for safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'join_requests'
      AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.join_requests
      ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- 3. RLS: allow authenticated inserts for the system-notification role
--    The existing "System can create notifications" policy already allows inserts
--    with check (true). We just verify it covers link_url.
--    The policy is on the authenticated role so any client with a valid JWT
--    (including the browser) can insert a notification on behalf of another
--    profile.  This is acceptable for club leaders acting through the app.
--    If you need stricter enforcement, add a service-role policy.
--
-- VERIFY existing policies cover link_url:
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'notifications';

-- Verify:
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'notifications'
--   ORDER BY ordinal_position;

-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'join_requests'
--   AND column_name = 'rejection_reason';
