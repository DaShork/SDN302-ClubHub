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
