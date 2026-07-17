import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth.jsx';

/* Returns the list of club ids the current user is mentoring for.
 * RLS already restricts `clubs` SELECT for Mentor to the clubs they
 * mentor (migration 002), so a plain select('id') on clubs gives us
 * exactly that set.
 */
export function useMentoredClubIds() {
  const { profileId, loading: authLoading } = useAuth();
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (authLoading || !profileId) {
      setLoading(authLoading);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('id, name, slug, logo_url, status, founded_year, categories (id, name), leader:leader_id (id, full_name)')
          .eq('mentor_id', profileId)
          .order('name');
        if (error) throw error;
        if (!cancelled) {
          setIds(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('useMentoredClubIds failed:', err);
          setIds([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profileId, authLoading]);

  return { ids, loading };
}
