-- ============================================================================
-- ClubHub: Expand audit_log RLS for Manager
-- Version: 1.0
--
-- Migration 012 only granted audit_log SELECT to 'Administrator'.
-- Manager also needs to read the log to power the new Manager activity-log
-- views (activity of clubs they oversee + audit entries written by managers).
-- This migration keeps Administrator access and adds Manager.
--
-- How to run:
--   Supabase Dashboard > SQL Editor > paste entire content > Run
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view audit log" ON public.audit_log;

CREATE POLICY "Admin and Manager can view audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (
    public.has_role('Administrator')
    OR public.has_role('Manager')
  );

-- Verify
-- SELECT * FROM public.audit_log ORDER BY created_at DESC LIMIT 20;
