import { supabase } from "./supabase";

export const announcementService = {
  // Fetch announcements visible to the user
  // If clubId is provided, returns announcements for that club as well as public manager announcements.
  // Otherwise, returns public manager announcements only.
  async getAnnouncements(clubId = null) {
    let query = supabase
      .from("announcements")
      .select(`
        *,
        profiles (
          id,
          full_name,
          avatar_url
        ),
        clubs (
          id,
          name,
          logo_url
        )
      `);

    if (clubId) {
      query = query.or(`club_id.eq.${clubId},club_id.is.null`);
    } else {
      query = query.is("club_id", null);
    }

    const { data, error } = await query
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Fetch announcement by ID
  async getAnnouncementById(announcementId) {
    const { data, error } = await supabase
      .from("announcements")
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        ),
        clubs (
          id,
          name
        )
      `)
      .eq("id", announcementId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new announcement
  async createAnnouncement(announcementData) {
    const { data, error } = await supabase
      .from("announcements")
      .insert([announcementData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update an announcement
  async updateAnnouncement(announcementId, announcementData) {
    const { data, error } = await supabase
      .from("announcements")
      .update({ ...announcementData, updated_at: new Date() })
      .eq("id", announcementId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete an announcement
  async deleteAnnouncement(announcementId) {
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId);

    if (error) throw error;
    return true;
  }
};
