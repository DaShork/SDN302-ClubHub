import { supabase } from './supabase';

/**
 * Alumni Service
 * Alumni directory: search + list with profile join.
 */

export async function listAlumni({ limit = 20, offset = 0, graduationYear, company } = {}) {
  let query = supabase
    .from('alumni')
    .select('*, profiles(id, full_name, email, avatar_url, student_code, faculty, major)', { count: 'exact' })
    .order('graduation_year', { ascending: false })
    .range(offset, offset + limit - 1);

  if (graduationYear) {
    query = query.eq('graduation_year', graduationYear);
  }
  if (company) {
    query = query.ilike('company', `%${company}%`);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

export async function searchAlumni(searchQuery, { limit = 20 } = {}) {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return listAlumni({ limit });
  }

  const { data, error } = await supabase
    .from('alumni')
    .select('*, profiles(id, full_name, email, avatar_url, student_code, faculty, major)', { count: 'exact' })
    .or(`profiles.full_name.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`)
    .order('graduation_year', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

export async function getAlumniById(alumniId) {
  const { data, error } = await supabase
    .from('alumni')
    .select('*, profiles(id, full_name, email, avatar_url, student_code, faculty, major, phone)')
    .eq('id', alumniId)
    .single();
  return { data, error };
}

export async function getAlumniCount() {
  const { count, error } = await supabase
    .from('alumni')
    .select('*', { count: 'exact', head: true });
  return { count: count || 0, error };
}

export async function getGraduationYears() {
  const { data, error } = await supabase
    .from('alumni')
    .select('graduation_year')
    .order('graduation_year', { ascending: false });

  const years = [...new Set((data || []).map(r => r.graduation_year).filter(Boolean))];
  return { data: years, error };
}

export async function updateAlumni(alumniId, updates) {
  const { data, error } = await supabase
    .from('alumni')
    .update(updates)
    .eq('id', alumniId)
    .select()
    .single();
  return { data, error };
}
