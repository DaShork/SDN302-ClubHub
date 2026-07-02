-- ============================================================================
-- ClubHub Triggers & Functions
-- Version: 1.0 (MVP)
-- Auto-create profiles when users sign up
-- ============================================================================

-- ============================================================================
-- FUNCTION: Auto-create profile on user signup
-- ============================================================================
-- When a new user is created in auth.users, this trigger automatically
-- creates a corresponding profile with default 'Student' role.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  student_role_id UUID;
BEGIN
  -- Get the Student role ID (default role for new users)
  SELECT id INTO student_role_id FROM public.roles WHERE name = 'Student' LIMIT 1;

  -- Insert profile row
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role_id, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    student_role_id,
    'active'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fire after a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Update updated_at timestamp automatically
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables with updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_clubs_updated_at ON public.clubs;
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_memberships_updated_at ON public.memberships;
CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workshops_updated_at ON public.workshops;
CREATE TRIGGER update_workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_updated_at ON public.knowledge_articles;
CREATE TRIGGER update_knowledge_updated_at
  BEFORE UPDATE ON public.knowledge_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FUNCTION: Update event status based on time
-- ============================================================================
-- Useful for scheduled jobs to mark events as ongoing/finished.
-- Call manually or via pg_cron / Supabase Edge Function.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_event_status()
RETURNS void AS $$
BEGIN
  UPDATE public.events SET status = 'ongoing'
  WHERE status = 'upcoming'
    AND start_time <= NOW()
    AND (end_time IS NULL OR end_time > NOW());

  UPDATE public.events SET status = 'finished'
  WHERE status IN ('upcoming', 'ongoing')
    AND end_time IS NOT NULL
    AND end_time <= NOW();
END;
$$ LANGUAGE plpgsql;
