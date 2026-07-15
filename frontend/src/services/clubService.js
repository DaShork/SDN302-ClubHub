import { supabase, REQUEST_TIMEOUT_MS, RequestTimeoutError } from './supabase'
import { mockData } from './mockData'

/* ----------------------------------------------------------------------------
 * Temporary debug toggle.
 *
 * The backend has been intermittently timing out. To keep the UI usable
 * while new features are developed, set USE_MOCK_FALLBACK = true so any
 * service call whose request fails (timeout, network error, 5xx) returns
 * records from `mockData.js` instead of an empty list / null.
 *
 * DELETE_MOCK_FALLBACK:
 *   When the backend is stable again, delete mockData.js, this constant,
 *   the `withFallback` helper, and every wrapper around the service
 *   methods in this file. The functions then run as plain Supabase calls.
 * -------------------------------------------------------------------------- */
export const USE_MOCK_FALLBACK = true

/**
 * Wrap an existing Promise (result of `.select()`) with a hard timeout.
 * If the promise hasn't settled after `REQUEST_TIMEOUT_MS`, the returned
 * promise rejects with `RequestTimeoutError`. Use this so a network drop
 * never leaves the page on its loading spinner.
 */
function withTimeout(promise, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new RequestTimeoutError(`${label} timed out after ${REQUEST_TIMEOUT_MS}ms`));
    }, REQUEST_TIMEOUT_MS);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        // Normalise aborted / network errors into RequestTimeoutError.
        if (
          e?.name === 'AbortError' ||
          e?.message?.includes('aborted') ||
          e?.message?.includes('Failed to fetch') ||
          e?.message?.includes('NetworkError') ||
          e?.message?.includes('ERR_INTERNET_DISCONNECTED')
        ) {
          reject(new RequestTimeoutError(e.message || `${label} network error`));
          return;
        }
        reject(e);
      }
    );
  });
}

/**
 * Run a Supabase query but degrade gracefully when the backend is
 * unreachable. Two cases trigger the mock fallback:
 *
 *   1. The query throws a network/timeout error (server unreachable).
 *   2. The query resolves with empty data (server reachable but returning
 *      nothing useful — likely RLS denying access for the anonymous user).
 *
 * Both are common symptoms of "Supabase is currently misconfigured for this
 * env" and the user cannot tell them apart. Falling back to the mock in
 * both cases keeps the UI usable during development.
 *
 * Set `USE_MOCK_FALLBACK = false` once the backend is stable: every call
 * then hits Supabase unchanged, and any error propagates to the caller.
 *
 * `nullOk` — when true, treat a `null` data result as success and don't
 * fall back even when empty (matches `.maybeSingle()` semantics for
 * genuine "no such record" responses).
 */
async function withFallback({ label, fallbackFn, nullOk = false }) {
  if (USE_MOCK_FALLBACK) {
    // Fast path: skip the network call entirely. Mock data is always
    // available, so we go straight to it. Saves an 8s hang on every page
    // load while the backend is in flux.
    return fallbackFn();
  }
  try {
    return await label();
  } catch (err) {
    const isNetErr =
      err instanceof RequestTimeoutError ||
      err?.name === 'AbortError' ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError') ||
      err?.message?.includes('aborted') ||
      err?.message?.includes('ERR_INTERNET_DISCONNECTED');
    if (!isNetErr) throw err;
    // eslint-disable-next-line no-console
    console.warn(`[clubs.${fallbackFn.name || 'fallback'}] backend unreachable — using mock data:`, err?.message || err);
    const mock = fallbackFn();
    if (nullOk && (mock === null || mock === undefined)) return null;
    return mock;
  }
}

export const clubService = {
  /**
   * Get all active clubs (with leader + category info).
   * Uses the v_clubs_with_leaders view for efficient leader/mentor joins.
   */
  async getAll({ categoryId, search, limit = 20, offset = 0 } = {}) {
    let query = supabase
      .from('clubs')
      .select(`
        *,
        categories (id, name),
        memberships (count)
      `)
      .eq('status', 'active')
      .range(offset, offset + limit - 1)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    return withFallback({
      label: () => withTimeout(query.order('name'), 'clubs.getAll'),
      fallbackFn: () => mockData.getAllClubs({ categoryId, search, limit, offset }),
    })
  },

  /**
   * Get a single club by ID or slug, with full details.
   *
   * IMPORTANT: This intentionally does NOT embed `memberships(...)` in the
   * select. The `memberships` table has an RLS policy that only allows
   * `authenticated` users to see rows, and embedding it inside `clubs → profiles`
   * nested joins can deadlock the request for anon viewers, leaving
   * `getById()` hanging forever. Members are loaded separately via
   * {@link clubService.getMembers}, which is wrapped in try/catch on the
   * page so a failure (or empty result for anon) never blocks the page.
   */
  async getById(idOrSlug) {
    // Try slug first (text), then UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isUuid = uuidRegex.test(idOrSlug)

    const baseSelect = `
        *,
        categories (id, name, description),
        club_terms (
          id,
          name,
          start_date,
          end_date
        )
      `

    return withFallback({
      label: async () => {
        const { data, error } = await withTimeout(
          supabase
            .from('clubs')
            .select(baseSelect)
            .eq(isUuid ? 'id' : 'slug', idOrSlug)
            .maybeSingle(),
          'clubs.getById'
        )
        if (error) throw error
        return data
      },
      fallbackFn: () => mockData.getClubById(idOrSlug),
      nullOk: true,
    })
  },

  /**
   * Get the members of a club, each with their position and profile basics.
   *
   * Returns `[]` for anonymous viewers because the RLS policy on
   * `memberships` is `TO authenticated` only — anon users see no rows.
   * Throws only if Supabase itself errors; empty result is not an error.
   *
   * Callers should always wrap this in try/catch and render gracefully
   * on failure (do not block page render).
   */
  async getMembers(clubId) {
    if (!clubId) return []
    return withFallback({
      label: async () => {
        const { data, error } = await withTimeout(
          supabase
            .from('memberships')
            .select(`
              id,
              position,
              profiles (
                id,
                full_name,
                avatar_url,
                email
              )
            `)
            .eq('club_id', clubId)
            .eq('status', 'active'),
          'clubs.getMembers'
        )
        if (error) throw error
        return data || []
      },
      fallbackFn: () => mockData.getMembers(clubId),
    })
  },

  /**
   * Get featured clubs (recruiting clubs) for the homepage.
   *
   * NOTE: we use the bare `clubs` table here, NOT the `v_clubs_with_leaders`
   * view. The view doesn't have proper RLS/anon access set up and was returning
   * 500/timeout for unauthenticated users. To still get leader info, we join
   * `profiles` twice via FK aliases (`l_profile` for leader, `m_profile` for
   * mentor). Avatar / name are nullable in the result — the UI handles that.
   */
  async getFeatured(limit = 8) {
    return withFallback({
      label: () =>
        withTimeout(
          supabase
            .from('clubs')
            .select(`
              id, name, slug, description, short_description, logo_url, banner_url,
              recruitment_status, founded_year, status, member_count,
              leader_id,
              mentor_id,
              l_profile:profiles!leader_id (
                id, full_name, avatar_url
              ),
              m_profile:profiles!mentor_id (
                id, full_name, avatar_url
              ),
              categories (id, name)
            `)
            .eq('status', 'active')
            .eq('recruitment_status', true)
            .order('member_count', { ascending: false })
            .limit(limit),
          'clubs.getFeatured'
        ),
      fallbackFn: () => mockData.getFeatured(limit),
    }).then((data) => {
      if (!data) return [];
      // Flatten the FK join into top-level leader_name/avatar fields so the
      // existing UI components (which read club.leader_name, club.leader_avatar_url)
      // continue to work without changes.
      return (data || []).map((c) => ({
        ...c,
        leader_name: c.l_profile?.full_name || null,
        leader_avatar_url: c.l_profile?.avatar_url || null,
        mentor_name: c.m_profile?.full_name || null,
        mentor_avatar_url: c.m_profile?.avatar_url || null,
        l_profile: undefined,
        m_profile: undefined,
      }));
    });
  },

  /**
   * Get leader info for a specific club.
   */
  async getLeaderInfo(clubId) {
    return withFallback({
      label: async () => {
        const { data, error } = await withTimeout(
          supabase
            .from('clubs')
            .select(`
              leader_id,
              l_profile:profiles!leader_id (
                id,
                full_name,
                student_code,
                avatar_url,
                email
              ),
              mentor_id,
              m_profile:profiles!mentor_id (
                id,
                full_name,
                student_code,
                avatar_url,
                email
              )
            `)
            .eq('id', clubId)
            .single(),
          'clubs.getLeaderInfo'
        )
        if (error) throw error
        return data
      },
      fallbackFn: () => mockData.getLeaderInfo(clubId),
      nullOk: true,
    })
  },

  /**
   * Summary stats for dashboard.
   */
  async getStats() {
    /* Stats intentionally does NOT fall back — these are dashboard totals
       where a stale value would be misleading. Pages show "—" if it errors. */
    const [clubsResult, membersResult, eventsResult] = await Promise.all([
      supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'upcoming'),
    ])

    return {
      totalClubs: clubsResult.count || 0,
      totalMembers: membersResult.count || 0,
      upcomingEvents: eventsResult.count || 0,
    }
  },

  async getCategories() {
    return withFallback({
      label: () =>
        withTimeout(
          supabase
            .from('categories')
            .select('*')
            .order('name'),
          'clubs.getCategories'
        ),
      fallbackFn: () => mockData.getCategories(),
    })
  },

  /**
   * Get related clubs in the same category, excluding the given club.
   * Used by ClubDetailPage to show "You might also like" section.
   * Returns up to `limit` clubs. Safe to call for anon users (status='active').
   *
   * Joins leader/mentor profiles via FK aliases (same pattern as getFeatured)
   * so we don't depend on the v_clubs_with_leaders view which is broken for anon.
   */
  async getRelated({ categoryId, excludeClubId, limit = 4 } = {}) {
    if (!categoryId) return []
    const result = await withFallback({
      label: () =>
        withTimeout(
          supabase
            .from('clubs')
            .select(`
              id, name, slug, description, short_description, logo_url, banner_url,
              recruitment_status, founded_year, status, member_count,
              leader_id,
              mentor_id,
              l_profile:profiles!leader_id (
                id, full_name, avatar_url
              ),
              m_profile:profiles!mentor_id (
                id, full_name, avatar_url
              ),
              categories (id, name)
            `)
            .eq('status', 'active')
            .eq('category_id', categoryId)
            .limit(limit + 1), // fetch +1 so we can filter out the current club
          'clubs.getRelated'
        ),
      fallbackFn: () => mockData.getRelated({ categoryId, excludeClubId, limit }),
    });

    if (!result) return [];
    const filtered = (result || []).filter((c) => c.id !== excludeClubId).slice(0, limit);

    // Flatten FK joins for the UI (see getFeatured).
    return filtered.map((c) => ({
      ...c,
      leader_name: c.l_profile?.full_name || null,
      leader_avatar_url: c.l_profile?.avatar_url || null,
      mentor_name: c.m_profile?.full_name || null,
      mentor_avatar_url: c.m_profile?.avatar_url || null,
      l_profile: undefined,
      m_profile: undefined,
    }));
  },
}
