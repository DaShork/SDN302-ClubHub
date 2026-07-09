import { supabase } from './supabase'

export const clubService = {
  /**
   * Get all active clubs (with leader + category info).
   * Uses the v_clubs_with_leaders view for efficient leader/mentor joins.
   */
  async getAll({ categoryId, search, limit = 20, offset = 0 } = {}) {
    let query = supabase
      .from('clubs')
      .select(`
        *,
        categories (id, name),
        memberships (count)
      `)
      .eq('status', 'active')
      .range(offset, offset + limit - 1)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query.order('name')

    if (error) throw error
    return data
  },

  /**
   * Get a single club by ID or slug, with full details.
   */
  async getById(idOrSlug) {
    // Try slug first (text), then UUID
    let query = supabase
      .from('clubs')
      .select(`
        *,
        categories (id, name, description),
        memberships (
          id,
          position,
          profiles (
            id,
            full_name,
            student_code,
            avatar_url,
            email
          )
        ),
        club_terms (
          id,
          name,
          start_date,
          end_date
        )
      `)

    // Detect whether input is a UUID or slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(idOrSlug)) {
      query = query.eq('id', idOrSlug)
    } else {
      query = query.eq('slug', idOrSlug)
    }

    const { data, error } = await query.single()

    if (error) throw error
    return data
  },

  /**
   * Get featured clubs (recruiting clubs) for the homepage.
   * Uses v_clubs_with_leaders view to include leader info in one query.
   */
  async getFeatured(limit = 8) {
    const { data, error } = await supabase
      .from('clubs')
      .select(`
        id, name, slug, description, short_description, logo_url, banner_url,
        recruitment_status, founded_year, status, member_count,
        leader_id, leader_name, leader_avatar_url,
        mentor_id, mentor_name, mentor_avatar_url,
        categories (id, name)
      `)
      .eq('status', 'active')
      .eq('recruitment_status', true)
      .order('member_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Get leader info for a specific club.
   */
  async getLeaderInfo(clubId) {
    const { data, error } = await supabase
      .from('clubs')
      .select(`
        leader_id,
        l_profile:profiles!leader_id (
          id,
          full_name,
          student_code,
          avatar_url,
          email
        ),
        mentor_id,
        m_profile:profiles!mentor_id (
          id,
          full_name,
          student_code,
          avatar_url,
          email
        )
      `)
      .eq('id', clubId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Summary stats for dashboard.
   */
  async getStats() {
    const [clubsResult, membersResult, eventsResult] = await Promise.all([
      supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'upcoming'),
    ])

    return {
      totalClubs: clubsResult.count || 0,
      totalMembers: membersResult.count || 0,
      upcomingEvents: eventsResult.count || 0,
    }
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },
}
