import { supabase } from "./supabase";

export const eventService = {
  // Fetch all events for a specific club
  async getClubEvents(clubId) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("club_id", clubId)
      .order("start_time", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Fetch a specific event by ID
  async getEventById(eventId) {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        clubs (
          id,
          name,
          logo_url
        )
      `)
      .eq("id", eventId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new event
  async createEvent(eventData) {
    const { data, error } = await supabase
      .from("events")
      .insert([eventData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update event details
  async updateEvent(eventId, eventData) {
    const { data, error } = await supabase
      .from("events")
      .update({ ...eventData, updated_at: new Date() })
      .eq("id", eventId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete an event
  async deleteEvent(eventId) {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;
    return true;
  },

  // Register a student for an event
  async registerForEvent(eventId, profileId) {
    const { data, error } = await supabase
      .from("event_registrations")
      .insert([{ event_id: eventId, profile_id: profileId, status: "registered" }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Cancel an event registration
  async cancelRegistration(eventId, profileId) {
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("event_id", eventId)
      .eq("profile_id", profileId);

    if (error) throw error;
    return true;
  },

  // Get registrations for a specific event
  async getEventRegistrations(eventId) {
    const { data, error } = await supabase
      .from("event_registrations")
      .select(`
        id,
        registered_at,
        status,
        profiles (
          id,
          full_name,
          student_code,
          email,
          avatar_url
        )
      `)
      .eq("event_id", eventId);

    if (error) throw error;
    return data;
  },

  // Record check-in attendance for a member at an event
  async checkInAttendance(eventId, membershipId, status = "present") {
    const { data, error } = await supabase
      .from("attendance")
      .insert([{
        event_id: eventId,
        membership_id: membershipId,
        status
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Fetch attendance records for a specific event
  async getEventAttendance(eventId) {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        id,
        check_in_time,
        status,
        memberships (
          id,
          position,
          profiles (
            id,
            full_name,
            student_code,
            email
          )
        )
      `)
      .eq("event_id", eventId);

    if (error) throw error;
    return data;
  }
};
