import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  signIn as svcSignIn,
  signUp as svcSignUp,
  signOut as svcSignOut,
  getSession,
  getCurrentProfile,
  onAuthChange,
} from '@/services/authService';

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

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileId: profile?.id ?? null,
      loading,
      isAuthenticated: !!session?.user,
      signIn: svcSignIn,
      signUp: svcSignUp,
      signOut: svcSignOut,
      refreshProfile,
    }),
    [session, profile, loading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}