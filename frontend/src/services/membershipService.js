import { supabase } from "./supabase";

export const membershipService = {
  // Get all memberships for a specific club
  async getClubMemberships(clubId, status = "active") {
    const { data, error } = await supabase
      .from("memberships")
      .select(`
        id,
        position,
        joined_at,
        status,
        profiles (
          id,
          full_name,
          student_code,
          email,
          avatar_url
        )
      `)
      .eq("club_id", clubId)
      .eq("status", status);

    if (error) throw error;
    return data;
  },

  // Add a new member to a club
  async addMember(clubId, profileId, position = "Member") {
    const { data, error } = await supabase
      .from("memberships")
      .insert([{ club_id: clubId, profile_id: profileId, position }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update a member's position/role within a club
  async updatePosition(membershipId, position) {
    const { data, error } = await supabase
      .from("memberships")
      .update({ position, updated_at: new Date() })
      .eq("id", membershipId)
      .select();

    if (error) throw error;
    return data[0];
  },

  async getProfileMemberships(profileId, status = "active") {
    const { data, error } = await supabase
      .from("memberships")
      .select(`
        id,
        club_id,
        position,
        joined_at,
        status,
        clubs (
          id,
          name,
          logo_url,
          banner_url,
          description,
          categories (id, name)
        )
      `)
      .eq("profile_id", profileId)
      .eq("status", status)
      .order("joined_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMembership(profileId, clubId) {
    const { data, error } = await supabase
      .from("memberships")
      .select("id, position, status, joined_at")
      .eq("profile_id", profileId)
      .eq("club_id", clubId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async joinClub(clubId, profileId, position = "Member") {
    const { data, error } = await supabase
      .from("memberships")
      .insert([{ club_id: clubId, profile_id: profileId, position, status: "active" }])
      .select();

    if (error) throw error;
    return data?.[0];
  },

  async leaveClub(clubId, profileId) {
    const { data, error } = await supabase
      .from("memberships")
      .update({ status: "left", left_at: new Date().toISOString().split("T")[0], updated_at: new Date() })
      .eq("club_id", clubId)
      .eq("profile_id", profileId)
      .select();

    if (error) throw error;
    return data?.[0];
  },

  // Change a member's status (active/inactive/left)
  async updateStatus(membershipId, status) {
    const updateData = { status, updated_at: new Date() };
    if (status === "left") {
      updateData.left_at = new Date().toISOString().split("T")[0];
    }

    const { data, error } = await supabase
      .from("memberships")
      .update(updateData)
      .eq("id", membershipId)
      .select();

    if (error) throw error;
    return data[0];
  }
};
