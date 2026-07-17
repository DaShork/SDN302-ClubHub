-- ============================================================================
-- ClubHub: Admin audit log
-- Version: 1.0
--
-- Tracks every privileged operation performed through the admin dashboard
-- (profile updates, status changes, role assignments, bulk actions).
-- Auto-logged via a trigger on profiles; the frontend can also call
-- adminService.writeAuditLog() for custom actions.
--
-- How to run:
--   Supabase Dashboard > SQL Editor > paste entire content > Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  target_table VARCHAR(50),
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON public.audit_log (target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log (created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Administrators read; no one writes directly (triggers run SECURITY DEFINER)
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (public.has_role('Administrator'));

-- ----------------------------------------------------------------
-- Trigger: log changes to profiles
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    changed_fields := jsonb_build_object('new', to_jsonb(NEW));
    INSERT INTO public.audit_log (actor_id, action, target_table, target_id, details)
    VALUES (auth.uid(), 'profile_created', 'profiles', NEW.id, changed_fields);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    changed_fields := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
    INSERT INTO public.audit_log (actor_id, action, target_table, target_id, details)
    VALUES (
      auth.uid(),
      CASE
        WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'profile_status_changed'
        WHEN OLD.role_id IS DISTINCT FROM NEW.role_id THEN 'profile_role_changed'
        ELSE 'profile_updated'
      END,
      'profiles',
      NEW.id,
      changed_fields
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (actor_id, action, target_table, target_id, details)
    VALUES (auth.uid(), 'profile_deleted', 'profiles', OLD.id, jsonb_build_object('old', to_jsonb(OLD)));
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_profile_changes ON public.profiles;
CREATE TRIGGER trg_log_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

-- Verify
-- SELECT * FROM public.audit_log ORDER BY created_at DESC LIMIT 20;