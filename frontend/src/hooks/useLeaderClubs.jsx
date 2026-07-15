import { useEffect, useState, useCallback, useMemo } from 'react';
import { clubService } from '@/services/clubService';
import { useAuth } from '@/hooks/useAuth.jsx';

/**
 * useLeaderClubs — resolves every club where the current user holds the
 * leader role and exposes them through a stable shape:
 *
 *   {
 *     ledClubs:    [{ id, name, slug, logo_url, banner_url, category_id, ... }],
 *     ledClubIds:  [uuid, uuid, ...],
 *     loading,
 *     error,
 *     refresh():    re-fetch,
 *   }
 *
 * Implementation:
 *   We rely on `clubs.leader_id` being kept in sync with
 *   `memberships.position='President'` by the `trg_sync_leader_id_to_memberships`
 *   trigger (see supabase/migrations/010_reverse_sync_leader.sql). Filtering by
 *   `leader_id = current profile id` therefore yields the same set as a
 *   memberships-join would, but in a single lightweight query.
 *
 * No DB schema changes were needed for this hook.
 *
 * Returns `loading=true` while auth is still hydrating so consumers can wait
 * for both auth and the leader list before deciding what to render.
 */
export function useLeaderClubs() {
  const { profileId, loading: authLoading, isAuthenticated } = useAuth();
  const [ledClubs, setLedClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLedClubs = useCallback(async () => {
    if (!isAuthenticated || !profileId) {
      setLedClubs([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Bump limit so a leader with many clubs doesn't get truncated at 20.
      const rows = await clubService.getAll({ leaderId: profileId, limit: 100 });
      setLedClubs(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error('[useLeaderClubs] failed to load led clubs:', err);
      setError(err);
      setLedClubs([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, isAuthenticated]);

  useEffect(() => {
    // Wait for auth to settle before deciding what to do.
    if (authLoading) return;
    fetchLedClubs();
  }, [authLoading, fetchLedClubs]);

  const ledClubIds = useMemo(
    () => ledClubs.map((c) => c.id).filter(Boolean),
    [ledClubs]
  );

  return {
    ledClubs,
    ledClubIds,
    loading: loading || authLoading,
    error,
    refresh: fetchLedClubs,
  };
}