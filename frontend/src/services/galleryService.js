import { supabase } from './supabase'

export const galleryService = {
  async getAll({ clubId, limit = 20, offset = 0 } = {}) {
    let query = supabase
      .from('galleries')
      .select(`
        *,
        clubs (id, name, logo_url)
      `)
      .order('uploaded_at', { ascending: false })

    if (clubId) {
      query = query.eq('club_id', clubId)
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) throw error
    return data
  },

  async getByClub(clubId) {
    const { data, error } = await supabase
      .from('galleries')
      .select(`
        *,
        clubs (id, name)
      `)
      .eq('club_id', clubId)
      .order('uploaded_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getFeatured(limit = 8) {
    const { data, error } = await supabase
      .from('galleries')
      .select(`
        *,
        clubs (id, name, logo_url)
      `)
      .order('uploaded_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },
}