/* Role constants and permissions for ClubHub.

   Roles are stored by their human-readable name in the Supabase `roles.name`
   column (Title Case, as in `004_seed_data.sql`). The 6 official roles follow
   AGENTS.md §5 and docs/FEATURES.md §"Role-based Features".

   IMPORTANT: these strings MUST match exactly what is inserted by the seed
   migration. The Postgres RLS helper `has_role(text)` is also called with
   these exact strings, so any change here must be mirrored in
   `supabase/migrations/002_rls_policies.sql` and `004_seed_data.sql`.

   Permission strings follow the `domain:action` convention so they can be
   matched generically (e.g. grants.has('club:edit')) and grouped by domain
   prefix. */

export const ROLES = Object.freeze({
  STUDENT: 'Student',
  CLUB_MEMBER: 'Club Member',
  CLUB_LEADER: 'Club Leader',
  MENTOR: 'Mentor',
  MANAGER: 'Manager',
  ADMINISTRATOR: 'Administrator',
});

/* Per-role display info used by the UI to render role badges. */
export const ROLE_META = {
  [ROLES.STUDENT]: { label: 'Student', shortLabel: 'SV', color: '#3B82F6' },
  [ROLES.CLUB_MEMBER]: { label: 'Club Member', shortLabel: 'Member', color: '#22C55E' },
  [ROLES.CLUB_LEADER]: { label: 'Club Leader', shortLabel: 'Leader', color: '#16685D' },
  [ROLES.MENTOR]: { label: 'Mentor', shortLabel: 'Mentor', color: '#F59E0B' },
  [ROLES.MANAGER]: { label: 'Manager (IC-PDP)', shortLabel: 'IC-PDP', color: '#7C3AED' },
  [ROLES.ADMINISTRATOR]: { label: 'Administrator', shortLabel: 'Admin', color: '#EF4444' },
};

/* Static grant map. Each role inherits all grants from roles earlier in the chain.
   The hierarchy is implemented in `GRANTS` below, not implicit inheritance — every
   grant is listed explicitly so you can audit what each role can do. */
const STUDENT_GRANTS = [
  /* Club discovery */
  'club:browse',
  'club:view',
  'club:view_recruitment',
  'club:view_board',
  'club:view_gallery',
  /* Events */
  'event:view',
  'event:register',
  /* Announcements */
  'announcement:view',
  /* AI Assistant */
  'ai:ask',
  'ai:search',
  /* Profile */
  'profile:view',
  'profile:edit_self',
  /* Auth */
  'auth:login',
  'auth:logout',
];

const CLUB_MEMBER_GRANTS = [
  /* Internal club content */
  'announcement:view_internal',
  'workshop:view_materials',
  'document:download',
  'meeting:view_minutes',
  'knowledge:access',
  /* Finance */
  'finance:view_fee',
  'finance:pay_sandbox',
  'finance:view_history',
  /* Events */
  'event:check_in_qr',
  'event:register_internal',
];

const CLUB_LEADER_GRANTS = [
  /* Dashboard */
  'dashboard:view_club_stats',
  /* Club management */
  'club:edit',
  'club:edit_recruitment',
  'club:manage_gallery',
  /* Members */
  'member:add',
  'member:remove',
  'member:update_role',
  /* Events */
  'event:create',
  'event:edit',
  'event:delete',
  /* Workshops */
  'workshop:create',
  'workshop:edit',
  'workshop:delete',
  /* Knowledge */
  'knowledge:create',
  'knowledge:edit',
  'knowledge:delete',
  'document:upload',
  'meeting:upload',
  'meeting:create_event_reflection',
  /* Announcements */
  'announcement:create',
  'announcement:edit',
  'announcement:delete',
  /* Finance */
  'finance:record_payment',
  'finance:update_payment_status',
  /* Reports */
  'report:attendance',
  'report:event_stats',
  'report:member_stats',
];

const MENTOR_GRANTS = [
  'dashboard:view_club',
  'knowledge:view',
  'workshop:view_materials',
  'meeting:view_event_reflection',
  'report:view',
  'knowledge:comment',
  'knowledge:recommend',
];

const MANAGER_GRANTS = [
  /* Club oversight */
  'club:manage',
  'club_category:manage',
  'club:monitor',
  'report:view',
  'announcement:publish',
  'mentor:assign',
  'club_leader:manage',
  'club:archive',
];

const ADMINISTRATOR_GRANTS = [
  'user:manage',
  'role:manage',
  'permission:manage',
  'category:manage',
  'ai:manage_config',
  'system:manage_config',
  'audit_log:view',
  'platform:manage_settings',
];

export const GRANTS = {
  [ROLES.STUDENT]: STUDENT_GRANTS,
  [ROLES.CLUB_MEMBER]: CLUB_MEMBER_GRANTS,
  [ROLES.CLUB_LEADER]: CLUB_LEADER_GRANTS,
  [ROLES.MENTOR]: MENTOR_GRANTS,
  [ROLES.MANAGER]: MANAGER_GRANTS,
  [ROLES.ADMINISTRATOR]: ADMINISTRATOR_GRANTS,
};

/* Returns a flat array of all permission strings granted to the role. */
export function grantsFor(roleId) {
  if (!roleId) return [];
  return GRANTS[roleId] ?? [];
}

/* Returns true if the role has the permission. */
export function roleCan(roleId, permission) {
  return grantsFor(roleId).includes(permission);
}

/* Returns true if any of the listed roles has the permission. */
export function rolesAnyCan(roleIds, permission) {
  if (!Array.isArray(roleIds)) return false;
  return roleIds.some((r) => roleCan(r, permission));
}

/* Returns the list of UI routes to navigate to after sign-in for each role.
   Used by GuestRoute / useAuth.landingRouteForRole() to land users on an
   appropriate dashboard after login. Only Student and Club Member have
   dedicated landing pages; Mentor / Manager / Administrator fall back to
   HomePage until their dashboards are built.

   Club Leaders land on `/my-clubs` so they can pick an active membership
   before being routed into `/club/:clubId/dashboard`. Resolving the
   "primary" club for a leader requires reading `memberships` and is done
   lazily inside GuestRoute when needed. */
export const ROLE_DEFAULT_ROUTE = {
  [ROLES.STUDENT]: '/',
  [ROLES.CLUB_MEMBER]: '/my-clubs',
  [ROLES.CLUB_LEADER]: '/my-clubs',
  [ROLES.MENTOR]: '/',
  [ROLES.MANAGER]: '/',
  [ROLES.ADMINISTRATOR]: '/',
};

/* Returns true when a role string looks like one of the 6 known roles. */
export function isKnownRole(roleId) {
  return Object.values(ROLES).includes(roleId);
}
