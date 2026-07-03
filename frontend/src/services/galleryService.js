import { supabase } from './supabase'
import { mockGalleries } from '@/mocks/data'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const galleryService = {
  async getAll({ clubId, limit = 20, offset = 0 } = {}) {
    if (USE_MOCKS) {
      let data = [...mockGalleries]
      if (clubId) data = data.filter((g) => g.club_id === clubId)
      data.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
      return data.slice(offset, offset + limit)
    }

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
    if (USE_MOCKS) {
      const data = mockGalleries
        .filter((g) => g.club_id === clubId)
        .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
      return data
    }

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
    if (USE_MOCKS) {
      const data = [...mockGalleries]
        .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
        .slice(0, limit)
      return data
    }

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
