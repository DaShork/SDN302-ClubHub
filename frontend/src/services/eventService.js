import { supabase } from './supabase'
import { mockEvents } from '@/mocks/data'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const eventService = {
  async getAll({ clubId, status = 'upcoming', limit = 20, offset = 0 } = {}) {
    if (USE_MOCKS) {
      let data = [...mockEvents]
      if (status) data = data.filter((e) => e.status === status)
      if (clubId) data = data.filter((e) => e.club_id === clubId)
      data.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      return data.slice(offset, offset + limit)
    }

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
    if (USE_MOCKS) {
      const data = mockEvents
        .filter((e) => e.status === 'upcoming' && new Date(e.start_time) >= new Date())
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .slice(0, limit)
      return data
    }

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
    if (USE_MOCKS) {
      const data = mockEvents.find((e) => e.id === id)
      if (!data) throw new Error('Event not found')
      return data
    }

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
    if (USE_MOCKS) {
      const data = mockEvents
        .filter((e) => e.club_id === clubId)
        .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
        .slice(0, limit)
      return data
    }

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
    if (USE_MOCKS) {
      // Stable fake count per event for dev
      const evt = mockEvents.find((e) => e.id === eventId)
      if (!evt) return 0
      return Math.min(evt.max_attendees, Math.floor(evt.max_attendees * 0.4))
    }

    const { count, error } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'registered')

    if (error) throw error
    return count || 0
  },
}
