import { supabase } from './supabase'

export const eventService = {
  async getAll({ clubId, status = 'upcoming', limit = 20, offset = 0 } = {}) {
    let query = supabase
      .from('events')
      .select(`
        *,
        clubs (id, name, logo_url)
      `)
      .order('start_time', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    if (clubId) {
      query = query.eq('club_id', clubId)
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) throw error
    return data
  },

  async getUpcoming(limit = 4) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs (id, name, logo_url)
      `)
      .eq('status', 'upcoming')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs (
          id,
          name,
          logo_url,
          description,
          contact_email
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async getByClub(clubId, limit = 10) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs (id, name, logo_url)
      `)
      .eq('club_id', clubId)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  async getRegistrationCount(eventId) {
    const { count, error } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'registered')

    if (error) throw error
    return count || 0
  },
}
