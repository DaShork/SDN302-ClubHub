import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  signIn as svcSignIn,
  signUp as svcSignUp,
  signOut as svcSignOut,
  getSession,
  getCurrentProfile,
  onAuthChange,
} from '@/services/authService';
import { grantsFor, roleCan, rolesAnyCan, ROLE_DEFAULT_ROUTE, ROLES } from '@/auth/rolePermissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const p = await getCurrentProfile();
    setProfile(p);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getSession();
        if (!mounted) return;
        setSession(s);
        await refreshProfile();
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const unsubscribe = onAuthChange(async (event, s) => {
      setSession(s ?? null);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refreshProfile]);

  const role = profile?.role_name ?? null;
  const grants = useMemo(() => grantsFor(role), [role]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileId: profile?.id ?? null,
      role,
      grants,
      loading,
      isAuthenticated: !!session?.user,

      signIn: svcSignIn,
      signUp: svcSignUp,
      signOut: svcSignOut,
      refreshProfile,

      /* ---- Role helpers ---- */
      hasRole(requiredRole) {
        if (!requiredRole) return true;
        if (Array.isArray(requiredRole)) return requiredRole.includes(role);
        return role === requiredRole;
      },
      can(permission) {
        return roleCan(role, permission);
      },
      canAny(permissions) {
        if (!Array.isArray(permissions) || permissions.length === 0) return true;
        return permissions.some((p) => roleCan(role, p));
      },
      canAll(permissions) {
        if (!Array.isArray(permissions) || permissions.length === 0) return true;
        return permissions.every((p) => roleCan(role, p));
      },
      anyCan(roles, permission) {
        return rolesAnyCan(roles, permission);
      },
      landingRouteForRole() {
        return ROLE_DEFAULT_ROUTE[role] ?? '/';
      },
      ROLES,
    }),
    [session, profile, role, grants, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
