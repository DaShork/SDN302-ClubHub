-- ============================================================================
-- ClubHub: Monthly club fee settings
-- Version: 1.0
--
-- Each Club can declare a single monthly fee amount via `club_fee_settings`
-- (one row per club, upserted by leader). Members then see their
-- payment status for the current month (paid = payment row exists for the
-- current calendar month).
--
-- How to run:
--   Supabase Dashboard > SQL Editor > paste entire content > Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.club_fee_settings (
  club_id UUID PRIMARY KEY REFERENCES public.clubs(id) ON DELETE CASCADE,
  monthly_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'VND',
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.club_fee_settings ENABLE ROW LEVEL SECURITY;

-- Members of a club (active membership) can read the fee for that club.
CREATE POLICY "Club members can read club fee settings" ON public.club_fee_settings
  FOR SELECT TO authenticated USING (
    public.is_club_member(club_id)
    OR public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- Only the leader of the club can upsert/update the fee setting. Manager
-- and Administrator get a backstop in case the leader is unavailable.
CREATE POLICY "Club leader can manage fee settings" ON public.club_fee_settings
  FOR ALL TO authenticated USING (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  )
  WITH CHECK (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- Verify
-- SELECT * FROM public.club_fee_settings;