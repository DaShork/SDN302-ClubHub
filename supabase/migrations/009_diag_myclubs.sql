-- ============================================================================
-- Diagnose: why MyClubsPage shows no clubs
-- Run in Supabase Dashboard > SQL Editor while logged in as the affected user
-- ============================================================================

-- (1) Confirm auth.uid() resolves correctly
SELECT auth.uid() AS my_auth_uid, auth.role() AS my_role;

-- (2) Profile exists for this auth user?
SELECT id, email, full_name, status, role_id
FROM public.profiles
WHERE id = auth.uid();

-- (3) Memberships visible to this user (raw)
SELECT id, profile_id, club_id, position, status, term_id, joined_at
FROM public.memberships
WHERE profile_id = auth.uid()
ORDER BY joined_at DESC;

-- (4) Memberships in any status
SELECT id, profile_id, club_id, position, status, joined_at
FROM public.memberships
WHERE profile_id = auth.uid();

-- (5) Active memberships for any user (admin view via has_role bypass)
--    This shows what SHOULD appear if RLS were not blocking.
SELECT m.id, m.profile_id, p.email, m.club_id, c.name, m.position, m.status
FROM public.memberships m
LEFT JOIN public.profiles p ON p.id = m.profile_id
LEFT JOIN public.clubs c ON c.id = m.club_id
WHERE m.status = 'active'
ORDER BY m.joined_at DESC
LIMIT 20;

-- (6) Profile ↔ auth link check
--    If a profile row exists but auth.uid() returns different value,
--    the trigger on auth.users may have failed silently.
SELECT
  (SELECT count(*) FROM auth.users WHERE id = auth.uid()) AS auth_user_count,
  (SELECT count(*) FROM public.profiles WHERE id = auth.uid()) AS profile_count;

-- (7) Check role grants — if user has Manager/Admin role they bypass RLS
SELECT pr.name, ur.profile_id
FROM public.user_roles ur
JOIN public.roles pr ON pr.id = ur.role_id
WHERE ur.profile_id = auth.uid();
