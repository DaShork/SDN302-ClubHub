import { supabase } from "./supabase";

export const meetingService = {
  // Fetch meeting minutes for a specific club
  async getMeetingMinutes(clubId) {
    const { data, error } = await supabase
      .from("meeting_minutes")
      .select(`
        *,
        profiles (
          id,
          full_name
        )
      `)
      .eq("club_id", clubId)
      .order("meeting_date", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Fetch meeting minutes details by ID
  async getMeetingMinutesById(minutesId) {
    const { data, error } = await supabase
      .from("meeting_minutes")
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq("id", minutesId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new meeting minute
  async createMeetingMinutes(minutesData) {
    const { data, error } = await supabase
      .from("meeting_minutes")
      .insert([minutesData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update meeting minutes
  async updateMeetingMinutes(minutesId, minutesData) {
    const { data, error } = await supabase
      .from("meeting_minutes")
      .update(minutesData)
      .eq("id", minutesId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete meeting minutes
  async deleteMeetingMinutes(minutesId) {
    const { error } = await supabase
      .from("meeting_minutes")
      .delete()
      .eq("id", minutesId);

    if (error) throw error;
    return true;
  }
};
