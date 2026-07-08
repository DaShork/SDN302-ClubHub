import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

const DEMO_PROFILE = {
  id: 'demo-user',
  full_name: 'Demo Student',
  student_code: 'SE000000',
  email: 'demo@fpt.edu.vn',
  avatar_url: null,
  role: 'Student',
  role_id: null,
  faculty: 'Software Engineering',
  major: 'SE',
  phone: '',
  status: 'active',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('Student');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('id', authUser.id)
      .single();

    if (!error && data) {
      setProfile({
        ...data,
        role: data.roles?.name || 'Student',
      });
      setRole(data.roles?.name || 'Student');
    } else {
      setProfile({
        ...DEMO_PROFILE,
        id: authUser.id,
        email: authUser.email,
        role: 'Student',
      });
      setRole('Student');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setProfile(null);
          setRole('Student');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setProfile({ ...DEMO_PROFILE, email, role: 'Student' });
        setUser({ id: 'demo-user', email });
        setRole('Student');
        return { success: false, error: error.message, isDemo: true };
      }
      return { success: true };
    } catch (err) {
      setProfile({ ...DEMO_PROFILE, role: 'Student' });
      setUser({ id: 'demo-user' });
      setRole('Student');
      return { success: false, error: err.message, isDemo: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole('Student');
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false };
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('*, roles(name)')
      .single();

    if (!error && data) {
      setProfile({ ...profile, ...data, role: data.roles?.name || profile.role });
      setRole(data.roles?.name || profile.role);
      return { success: true, data };
    }
    return { success: false, error };
  }, [user, profile]);

  const isRole = useCallback((...roles) => roles.includes(role), [role]);

  const value = {
    user,
    profile,
    role,
    loading,
    signIn,
    signOut,
    updateProfile,
    isRole,
    isDemo: !user || user.id === 'demo-user',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
