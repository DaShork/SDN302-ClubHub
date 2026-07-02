import { supabase } from './supabase'

export const clubService = {
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

  async getById(id) {
    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        categories (id, name, description),
        memberships!inner (
          id,
          position,
          profiles!inner (
            id,
            full_name,
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
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error) throw error
    return data
  },

  async getFeatured(limit = 6) {
    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        categories (id, name),
        memberships (count)
      `)
      .eq('status', 'active')
      .eq('recruitment_status', true)
      .limit(limit)

    if (error) throw error
    return data
  },

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
