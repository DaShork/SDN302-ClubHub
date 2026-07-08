import { supabase } from "./supabase";

export const eventService = {
  async getClubEvents(clubId, limit = 50) {
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
      .eq("club_id", clubId)
      .order("start_time", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        clubs (
          id,
          name,
          logo_url,
          banner_url
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getByClub(clubId, limit = 50) {
    return this.getClubEvents(clubId, limit);
  },

  async getRegistrationCount(eventId) {
    const { count, error } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .neq("status", "cancelled");

    if (error) throw error;
    return count || 0;
  },

  async getUserRegistrations(profileId) {
    const { data, error } = await supabase
      .from("event_registrations")
      .select(`
        id,
        event_id,
        registered_at,
        status,
        qr_code,
        events (
          id,
          title,
          start_time,
          end_time,
          location,
          cover_image_url,
          banner_url,
          clubs (id, name, logo_url)
        )
      `)
      .eq("profile_id", profileId)
      .order("registered_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async isUserRegistered(eventId, profileId) {
    const { data, error } = await supabase
      .from("event_registrations")
      .select("id, status, qr_code")
      .eq("event_id", eventId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async register(eventId, profileId) {
    const qrCode = `CHB-${eventId.slice(0, 6)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data, error } = await supabase
      .from("event_registrations")
      .upsert(
        [{ event_id: eventId, profile_id: profileId, status: "registered", qr_code: qrCode }],
        { onConflict: "event_id,profile_id" }
      )
      .select();

    if (error) throw error;
    return data?.[0];
  },

  async cancelRegistrationByUser(eventId, profileId) {
    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "cancelled", updated_at: new Date() })
      .eq("event_id", eventId)
      .eq("profile_id", profileId);

    if (error) throw error;
    return true;
  },

  async findByQrCode(qrCode) {
    const { data, error } = await supabase
      .from("event_registrations")
      .select(`
        id,
        status,
        qr_code,
        event_id,
        profile_id,
        events (id, title, start_time),
        profiles (id, full_name, email)
      `)
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async checkInByQr(qrCode) {
    const reg = await this.findByQrCode(qrCode);
    if (!reg) return { ok: false, reason: "not_registered" };
    if (reg.status === "cancelled") return { ok: false, reason: "cancelled" };
    if (reg.status === "checked_in") return { ok: false, reason: "already", reg };

    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "checked_in", checked_in_at: new Date().toISOString() })
      .eq("id", reg.id);

    if (error) throw error;
    return { ok: true, reg: { ...reg, status: "checked_in" } };
  },

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
