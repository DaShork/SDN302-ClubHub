import { createContext, useContext, useMemo } from 'react';
import { useLeaderClubs } from '@/hooks/useLeaderClubs.jsx';
import { useSearchParams } from 'react-router-dom';

/**
 * LeaderScopeContext — provides the leader-scoped state to every page under
 * /leader/*. Mounted once by the LeaderShell layout component, so we don't
 * re-fetch the "clubs I lead" list on every tab navigation.
 *
 * Shape:
 *   {
 *     ledClubs, ledClubIds, loading, error,
 *     selectedClubId:    null when 'all' (default) or a club UUID,
 *     selectedClub:      the matching club object, or null,
 *     isAllScope:        boolean,
 *     refresh(),
 *   }
 */
const LeaderScopeContext = createContext(null);

export function LeaderScopeProvider({ children }) {
  const leader = useLeaderClubs();
  const [searchParams] = useSearchParams();
  const rawSelected = searchParams.get('club');
  const isAllScope = !rawSelected || rawSelected === 'all';

  const selectedClub = useMemo(() => {
    if (isAllScope) return null;
    return leader.ledClubs.find((c) => c.id === rawSelected) || null;
  }, [isAllScope, rawSelected, leader.ledClubs]);

  const value = useMemo(
    () => ({
      ...leader,
      selectedClubId: isAllScope ? null : rawSelected,
      selectedClub,
      isAllScope,
    }),
    [leader, isAllScope, rawSelected, selectedClub]
  );

  return (
    <LeaderScopeContext.Provider value={value}>
      {children}
    </LeaderScopeContext.Provider>
  );
}

export function useLeaderScope() {
  const ctx = useContext(LeaderScopeContext);
  if (!ctx) {
    throw new Error('useLeaderScope must be used inside <LeaderScopeProvider>');
  }
  return ctx;
}