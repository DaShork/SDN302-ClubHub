import { supabase } from './supabase'

export const categoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        clubs (
          id,
          name,
          logo_url,
          description
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async getClubCount(categoryId) {
    const { count, error } = await supabase
      .from('clubs')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('status', 'active')

    if (error) throw error
    return count || 0
  },
}
