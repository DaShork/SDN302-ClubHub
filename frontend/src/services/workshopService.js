import { supabase } from "./supabase";

export const workshopService = {
  // Fetch approved workshops for public display
  async getApproved({ clubId, limit = 20 } = {}) {
    let query = supabase
      .from("workshops")
      .select(`*, clubs (id, name, logo_url), profiles (id, full_name)`)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (clubId) query = query.eq("club_id", clubId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Fetch workshops for a specific club
  async getClubWorkshops(clubId) {
    const { data, error } = await supabase
      .from("workshops")
      .select(`
        *,
        events (
          id,
          title,
          start_time
        ),
        profiles (
          id,
          full_name
        )
      `)
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Fetch workshop details by ID
  async getWorkshopById(workshopId) {
    const { data, error } = await supabase
      .from("workshops")
      .select(`
        *,
        events (
          id,
          title,
          start_time,
          location
        ),
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq("id", workshopId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new workshop
  async createWorkshop(workshopData) {
    const { data, error } = await supabase
      .from("workshops")
      .insert([workshopData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update a workshop's details
  async updateWorkshop(workshopId, workshopData) {
    const { data, error } = await supabase
      .from("workshops")
      .update({ ...workshopData, updated_at: new Date() })
      .eq("id", workshopId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete a workshop
  async deleteWorkshop(workshopId) {
    const { error } = await supabase
      .from("workshops")
      .delete()
      .eq("id", workshopId);

    if (error) throw error;
    return true;
  }
};
