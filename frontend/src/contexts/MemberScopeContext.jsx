import { createContext, useContext, useMemo } from 'react';
import { useMemberClubs } from '@/hooks/useMemberClubs.jsx';
import { useSearchParams } from 'react-router-dom';

/**
 * MemberScopeContext — provides the member-scoped state to every page
 * under /member/*. Same pattern as LeaderScopeContext.
 *
 * Shape:
 *   {
 *     memberClubs, memberClubIds, loading, error,
 *     selectedMembershipId: null when 'all' (default) or a membership UUID,
 *     selectedClubId:        derived from selected membership,
 *     selectedClub:          the matching club object, or null,
 *     isAllScope:            boolean,
 *     refresh(),
 *   }
 */
const MemberScopeContext = createContext(null);

export function MemberScopeProvider({ children }) {
  const member = useMemberClubs();
  const [searchParams] = useSearchParams();
  const rawSelected = searchParams.get('club');
  const isAllScope = !rawSelected || rawSelected === 'all';

  const selectedMembership = useMemo(() => {
    if (isAllScope) return null;
    return member.memberClubs.find((m) => m.clubId === rawSelected) || null;
  }, [isAllScope, rawSelected, member.memberClubs]);

  const selectedClub = selectedMembership?.club || null;

  const value = useMemo(
    () => ({
      ...member,
      selectedMembershipId: isAllScope ? null : rawSelected,
      selectedClubId: isAllScope ? null : rawSelected,
      selectedClub,
      isAllScope,
    }),
    [member, isAllScope, rawSelected, selectedClub]
  );

  return (
    <MemberScopeContext.Provider value={value}>
      {children}
    </MemberScopeContext.Provider>
  );
}

export function useMemberScope() {
  const ctx = useContext(MemberScopeContext);
  if (!ctx) {
    throw new Error('useMemberScope must be used inside <MemberScopeProvider>');
  }
  return ctx;
}