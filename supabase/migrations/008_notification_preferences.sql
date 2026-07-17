-- ============================================================================
-- 008: User notification preferences
-- ============================================================================
-- One row per user. Stores per-channel toggles for events/clubs/announcements.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_events BOOLEAN NOT NULL DEFAULT TRUE,
    email_clubs BOOLEAN NOT NULL DEFAULT TRUE,
    email_announcements BOOLEAN NOT NULL DEFAULT FALSE,
    push_events BOOLEAN NOT NULL DEFAULT TRUE,
    push_clubs BOOLEAN NOT NULL DEFAULT FALSE,
    push_announcements BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_notification_prefs_updated_at ON public.notification_preferences;
CREATE TRIGGER trg_notification_prefs_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: users can only see/edit their own row
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification prefs" ON public.notification_preferences;
CREATE POLICY "Users can view own notification prefs"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert own notification prefs" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification prefs"
    ON public.notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own notification prefs" ON public.notification_preferences;
CREATE POLICY "Users can update own notification prefs"
    ON public.notification_preferences FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete own notification prefs" ON public.notification_preferences;
CREATE POLICY "Users can delete own notification prefs"
    ON public.notification_preferences FOR DELETE
    USING (auth.uid() = profile_id);
