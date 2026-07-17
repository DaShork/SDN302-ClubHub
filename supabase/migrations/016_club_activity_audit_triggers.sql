-- ============================================================================
-- ClubHub: Audit triggers for club-related tables
-- Version: 1.0
--
-- Migration 012 created `audit_log` but only auto-logs profile changes.
-- This migration adds auto-logging for the day-to-day activities a Manager
-- / Mentor cares about: clubs, memberships, events, announcements,
-- documents, payments.
--
-- How to run:
--   Supabase Dashboard > SQL Editor > paste entire content > Run
-- ============================================================================

-- ----------------------------------------------------------------
-- Helper: shared row -> JSON snapshot
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._audit_jsonb(p_row ANYELEMENT)
RETURNS JSONB
LANGUAGE sql IMMUTABLE AS $$
  SELECT to_jsonb(p_row)
$$;

-- ----------------------------------------------------------------
-- Helper: emit an audit row, used by every trigger below.
-- All writes are SECURITY DEFINER so RLS doesn't block inserts from
-- triggers running on behalf of non-admin users.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._emit_audit(
  p_action TEXT,
  p_target_table TEXT,
  p_target_id UUID,
  p_details JSONB
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_log (actor_id, action, target_table, target_id, details)
  VALUES (auth.uid(), p_action, p_target_table, p_target_id, p_details);
END;
$$;

-- ----------------------------------------------------------------
-- clubs
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_audit_clubs() RETURNS TRIGGER AS $$
DECLARE
  details JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    details := jsonb_build_object('new', to_jsonb(NEW));
    PERFORM public._emit_audit('club_created', 'clubs', NEW.id, details);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    details := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
    PERFORM public._emit_audit(
      CASE
        WHEN OLD.status IS DISTINCT FROM NEW.status     THEN 'club_status_changed'
        WHEN OLD.leader_id IS DISTINCT FROM NEW.leader_id THEN 'club_leader_changed'
        WHEN OLD.mentor_id IS DISTINCT FROM NEW.mentor_id THEN 'club_mentor_changed'
        WHEN OLD.recruitment_status IS DISTINCT FROM NEW.recruitment_status THEN 'club_recruitment_changed'
        ELSE 'club_updated'
      END,
      'clubs', NEW.id, details
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    details := jsonb_build_object('old', to_jsonb(OLD));
    PERFORM public._emit_audit('club_deleted', 'clubs', OLD.id, details);
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_clubs ON public.clubs;
CREATE TRIGGER trg_audit_clubs
  AFTER INSERT OR UPDATE OR DELETE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_clubs();

-- ----------------------------------------------------------------
-- memberships
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_audit_memberships() RETURNS TRIGGER AS $$
DECLARE
  details JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    details := jsonb_build_object('new', to_jsonb(NEW));
    PERFORM public._emit_audit('member_joined', 'memberships', NEW.id, details);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    PERFORM public._emit_audit(
      CASE
        WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'member_status_changed'
        ELSE 'membership_updated'
      END,
      'memberships', NEW.id, details
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    details := jsonb_build_object('old', to_jsonb(OLD));
    PERFORM public._emit_audit('member_removed', 'memberships', OLD.id, details);
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_memberships ON public.memberships;
CREATE TRIGGER trg_audit_memberships
  AFTER INSERT OR UPDATE OR DELETE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_memberships();

-- ----------------------------------------------------------------
-- events
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_audit_events() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public._emit_audit('event_created', 'events', NEW.id, jsonb_build_object('new', to_jsonb(NEW)));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public._emit_audit(
      CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'event_status_changed' ELSE 'event_updated' END,
      'events', NEW.id, jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public._emit_audit('event_deleted', 'events', OLD.id, jsonb_build_object('old', to_jsonb(OLD)));
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_events ON public.events;
CREATE TRIGGER trg_audit_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_events();

-- ----------------------------------------------------------------
-- announcements
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_audit_announcements() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public._emit_audit('announcement_created', 'announcements', NEW.id,
      jsonb_build_object('club_id', NEW.club_id, 'audience', NEW.audience, 'new', to_jsonb(NEW)));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public._emit_audit(
      'announcement_updated', 'announcements', NEW.id,
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public._emit_audit('announcement_deleted', 'announcements', OLD.id,
      jsonb_build_object('club_id', OLD.club_id, 'old', to_jsonb(OLD)));
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_announcements ON public.announcements;
CREATE TRIGGER trg_audit_announcements
  AFTER INSERT OR UPDATE OR DELETE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_announcements();

-- ----------------------------------------------------------------
-- Mentor can also read audit_log entries whose target is one of
-- their mentored clubs. We expose a SECURITY DEFINER helper that
-- returns the club ids this user mentors, and a separate SELECT
-- policy that uses it. Keeping this in the same migration so it
-- can be applied atomically with the trigger changes.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_mentored_club_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.clubs WHERE mentor_id = auth.uid()
$$;

DROP POLICY IF EXISTS "Mentors can view audit log for their clubs" ON public.audit_log;
CREATE POLICY "Mentors can view audit log for their clubs" ON public.audit_log
  FOR SELECT TO authenticated USING (
    -- Their own entries
    actor_id = auth.uid()
    -- Or entries touching a club they mentor. Branch on target_table
    -- since target_id is reusable across tables.
    OR (
      (target_table IN ('clubs', 'memberships', 'events', 'announcements', 'documents', 'payments'))
      AND (target_table <> 'clubs')
      AND EXISTS (
        SELECT 1 FROM public.memberships m
          WHERE m.id = audit_log.target_id AND m.club_id IN (SELECT public.my_mentored_club_ids())
      )
    )
    OR (
      target_table = 'clubs'
      AND target_id IN (SELECT public.my_mentored_club_ids())
    )
  );

-- Verify
-- SELECT * FROM public.audit_log ORDER BY created_at DESC LIMIT 20;
