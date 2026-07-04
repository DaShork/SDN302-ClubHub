import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

/**
 * AuthContext — provides the currently logged-in Supabase Auth user
 * AND their matching profile row (with UUID) from the 'profiles' table.
 *
 * Usage:
 *   const { user, profile, profileId, loading } = useAuth();
 *   // profileId  →  UUID string to pass as created_by / uploaded_by etc.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // Supabase Auth user
  const [profile, setProfile] = useState(null);  // Row from profiles table
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      // profiles.id is linked to auth.users.id (same UUID)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) setProfile(data);
    } catch (_) {
      // silently fail — profile may not exist yet
    } finally {
      setLoading(false);
    }
  }

  const value = {
    user,
    profile,
    profileId: profile?.id ?? null,  // UUID — use this as created_by
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
