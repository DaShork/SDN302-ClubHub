import { useEffect, useState, useCallback, useMemo } from 'react';
import { membershipService } from '@/services/membershipService';
import { useAuth } from '@/hooks/useAuth.jsx';

/* useMemberClubs — resolves every club where the current user holds an
 * active membership (i.e. clubs they are a regular member of).
 *
 * Returns:
 *   {
 *     memberClubs:    [ { membershipId, clubId, club: {...}, position, joinedAt } ],
 *     memberClubIds:  [ uuid, ... ],
 *     loading,
 *     error,
 *     refresh(),
 *   }
 *
 * The service already attaches member_count and upcomingEventCount to each
 * entry (see membershipService.getProfileMembershipsWithStats), so the UI
 * can render quick-glance metrics without an extra round-trip.
 */
export function useMemberClubs() {
  const { profileId, loading: authLoading, isAuthenticated } = useAuth();
  const [memberClubs, setMemberClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMemberClubs = useCallback(async () => {
    if (!isAuthenticated || !profileId) {
      setMemberClubs([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const rows = await membershipService.getProfileMembershipsWithStats(profileId);
      setMemberClubs(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error('[useMemberClubs] failed to load member clubs:', err);
      setError(err);
      setMemberClubs([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    fetchMemberClubs();
  }, [authLoading, fetchMemberClubs]);

  const memberClubIds = useMemo(
    () => memberClubs.map((m) => m.clubId).filter(Boolean),
    [memberClubs]
  );

  return {
    memberClubs,
    memberClubIds,
    loading: loading || authLoading,
    error,
    refresh: fetchMemberClubs,
  };
}