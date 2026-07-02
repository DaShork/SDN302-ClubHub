-- ============================================================================
-- ClubHub RLS Policies
-- Version: 1.0 (MVP)
-- Row Level Security for role-based access control
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current user's role name
CREATE OR REPLACE FUNCTION public.get_user_role_name()
RETURNS TEXT AS $$
  SELECT r.name FROM public.profiles p
  JOIN public.roles r ON p.role_id = r.id
  WHERE p.id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = role_name
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is member of specific club
CREATE OR REPLACE FUNCTION public.is_club_member(p_club_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE profile_id = auth.uid()
      AND club_id = p_club_id
      AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is leader/mentor of specific club
CREATE OR REPLACE FUNCTION public.is_club_leader(p_club_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE profile_id = auth.uid()
      AND club_id = p_club_id
      AND status = 'active'
      AND position IN ('President', 'Vice President', 'Club Leader', 'Mentor')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROLES & CATEGORIES - Everyone can read, only admin can write
-- ============================================================================
CREATE POLICY "Roles are viewable by everyone" ON public.roles
  FOR SELECT USING (true);

CREATE POLICY "Only admin can manage roles" ON public.roles
  FOR ALL USING (public.has_role('Administrator'))
  WITH CHECK (public.has_role('Administrator'));

CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Manager/Admin can manage categories" ON public.categories
  FOR ALL USING (public.has_role('Manager') OR public.has_role('Administrator'))
  WITH CHECK (public.has_role('Manager') OR public.has_role('Administrator'));

-- ============================================================================
-- PROFILES - Everyone can view, user can edit own, admin can manage all
-- ============================================================================
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can manage all profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role('Administrator'))
  WITH CHECK (public.has_role('Administrator'));

-- ============================================================================
-- CLUBS - Everyone can view, Manager/Admin/Leader can manage
-- ============================================================================
CREATE POLICY "Clubs are viewable by everyone" ON public.clubs
  FOR SELECT USING (status = 'active' OR public.has_role('Administrator') OR public.has_role('Manager'));

CREATE POLICY "Club leaders can update own club" ON public.clubs
  FOR UPDATE TO authenticated
  USING (public.is_club_leader(id) OR public.has_role('Manager') OR public.has_role('Administrator'))
  WITH CHECK (public.is_club_leader(id) OR public.has_role('Manager') OR public.has_role('Administrator'));

CREATE POLICY "Manager/Admin can create clubs" ON public.clubs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role('Manager') OR public.has_role('Administrator'));

CREATE POLICY "Manager/Admin can delete clubs" ON public.clubs
  FOR DELETE TO authenticated
  USING (public.has_role('Manager') OR public.has_role('Administrator'));

-- ============================================================================
-- CLUB_TERMS
-- ============================================================================
CREATE POLICY "Club terms are viewable by everyone" ON public.club_terms
  FOR SELECT USING (true);

CREATE POLICY "Club leaders can manage terms" ON public.club_terms
  FOR ALL TO authenticated
  USING (public.is_club_leader(club_id) OR public.has_role('Manager') OR public.has_role('Administrator'))
  WITH CHECK (public.is_club_leader(club_id) OR public.has_role('Manager') OR public.has_role('Administrator'));

-- ============================================================================
-- MEMBERSHIPS
-- ============================================================================
CREATE POLICY "Members can view own memberships" ON public.memberships
  FOR SELECT TO authenticated USING (
    profile_id = auth.uid()
    OR public.is_club_member(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
    OR public.has_role('Mentor')
  );

CREATE POLICY "Club leaders can manage memberships" ON public.memberships
  FOR ALL TO authenticated
  USING (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  )
  WITH CHECK (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- EVENTS
-- ============================================================================
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Club leaders can manage events" ON public.events
  FOR ALL TO authenticated
  USING (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  )
  WITH CHECK (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- EVENT_REGISTRATIONS
-- ============================================================================
CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT TO authenticated USING (
    profile_id = auth.uid()
    OR public.is_club_leader((SELECT club_id FROM public.events WHERE id = event_id))
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

CREATE POLICY "Users can register for events" ON public.event_registrations
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can cancel own registration" ON public.event_registrations
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- ============================================================================
-- ATTENDANCE
-- ============================================================================
CREATE POLICY "Club members can view attendance" ON public.attendance
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = membership_id
        AND (m.profile_id = auth.uid() OR public.is_club_leader(m.club_id))
    )
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

CREATE POLICY "Club leaders can manage attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = membership_id AND public.is_club_leader(m.club_id)
    )
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- WORKSHOPS - Members can view, leaders can manage
-- ============================================================================
CREATE POLICY "Workshops are viewable by club members" ON public.workshops
  FOR SELECT TO authenticated USING (
    public.is_club_member(club_id)
    OR public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
    OR public.has_role('Mentor')
  );

CREATE POLICY "Club leaders can manage workshops" ON public.workshops
  FOR ALL TO authenticated
  USING (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  )
  WITH CHECK (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- KNOWLEDGE_ARTICLES - Public if no club, members if club-scoped
-- ============================================================================
CREATE POLICY "Public knowledge is viewable by everyone" ON public.knowledge_articles
  FOR SELECT USING (
    club_id IS NULL
    OR public.is_club_member(club_id)
    OR public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
    OR public.has_role('Mentor')
  );

CREATE POLICY "Club leaders can manage knowledge" ON public.knowledge_articles
  FOR ALL TO authenticated
  USING (
    (club_id IS NOT NULL AND public.is_club_leader(club_id))
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  )
  WITH CHECK (
    (club_id IS NOT NULL AND public.is_club_leader(club_id))
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- MEETING_MINUTES - Members only
-- ============================================================================
CREATE POLICY "Meeting minutes viewable by club members" ON public.meeting_minutes
  FOR SELECT TO authenticated USING (
    public.is_club_member(club_id)
    OR public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
    OR public.has_role('Mentor')
  );

CREATE POLICY "Club leaders can manage meeting minutes" ON public.meeting_minutes
  FOR ALL TO authenticated
  USING (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  )
  WITH CHECK (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- DOCUMENTS
-- ============================================================================
CREATE POLICY "Documents viewable by club members" ON public.documents
  FOR SELECT TO authenticated USING (
    public.is_club_member(club_id)
    OR public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
    OR public.has_role('Mentor')
  );

CREATE POLICY "Club leaders can manage documents" ON public.documents
  FOR ALL TO authenticated
  USING (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  )
  WITH CHECK (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- ANNOUNCEMENTS - Public for global, members for club-scoped
-- ============================================================================
CREATE POLICY "Announcements viewable based on audience" ON public.announcements
  FOR SELECT USING (
    (club_id IS NULL AND audience = 'public')
    OR (club_id IS NOT NULL AND (
        audience = 'public'
        OR public.is_club_member(club_id)
        OR public.is_club_leader(club_id)
      ))
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

CREATE POLICY "Club leaders/Managers can manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (
    (club_id IS NOT NULL AND public.is_club_leader(club_id))
    OR (club_id IS NULL AND (public.has_role('Manager') OR public.has_role('Administrator')))
    OR public.has_role('Administrator')
  )
  WITH CHECK (
    (club_id IS NOT NULL AND public.is_club_leader(club_id))
    OR (club_id IS NULL AND (public.has_role('Manager') OR public.has_role('Administrator')))
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- GALLERIES
-- ============================================================================
CREATE POLICY "Galleries are viewable by everyone" ON public.galleries
  FOR SELECT USING (true);

CREATE POLICY "Club leaders can manage galleries" ON public.galleries
  FOR ALL TO authenticated
  USING (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  )
  WITH CHECK (
    public.is_club_leader(club_id)
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- PAYMENTS - Users can view own, leaders can manage
-- ============================================================================
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = membership_id
        AND (m.profile_id = auth.uid() OR public.is_club_leader(m.club_id))
    )
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

CREATE POLICY "Users and leaders can manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = membership_id
        AND (m.profile_id = auth.uid() OR public.is_club_leader(m.club_id))
    )
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- ALUMNI - Public read, admin/manager write
-- ============================================================================
CREATE POLICY "Alumni directory viewable by authenticated users" ON public.alumni
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own alumni profile" ON public.alumni
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admin/Manager can manage alumni" ON public.alumni
  FOR ALL TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.has_role('Manager')
    OR public.has_role('Administrator')
  );

-- ============================================================================
-- NOTIFICATIONS - Users can view/update own
-- ============================================================================
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- CHAT_HISTORY - Users can view/manage own history
-- ============================================================================
CREATE POLICY "Users can view own chat history" ON public.chat_history
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

CREATE POLICY "Users can create own chat history" ON public.chat_history
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own chat history" ON public.chat_history
  FOR DELETE TO authenticated USING (profile_id = auth.uid());
