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

  /**
   * Get all clubs the user is a member of, with enriched stats:
   *  - club info (name, logo, banner, category, description)
   *  - current term name (e.g. "Fall 2025")
   *  - total member count per club
   *  - upcoming event count per club
   *
   * Single memberships query, then parallel count queries.
   * Falls back to auth.uid() if no profileId provided.
   */
  async getProfileMembershipsWithStats(profileId, { status = "active" } = {}) {
    const targetId = profileId || (await supabase.auth.getUser()).data?.user?.id;
    if (!targetId) {
      console.warn('[membershipService] No profileId and no auth user');
      return [];
    }
    console.log('[membershipService] Loading memberships for user:', targetId);

    // 1. Memberships + joined club + term
    const { data: mems, error } = await supabase
      .from("memberships")
      .select(`
        id,
        club_id,
        position,
        joined_at,
        status,
        term_id,
        clubs (
          id, name, slug, logo_url, banner_url, description,
          categories (id, name)
        ),
        club_terms (id, name, start_date, end_date)
      `)
      .eq("profile_id", targetId)
      .eq("status", status)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error('[membershipService] memberships query failed:', error);
      throw error;
    }
    console.log(`[membershipService] Found ${mems?.length || 0} memberships`);
    if (!mems || mems.length === 0) return [];

    const clubIds = [...new Set(mems.map((m) => m.club_id).filter(Boolean))];
    console.log('[membershipService] Club IDs:', clubIds);

    // 2. Member counts (active) per club — parallel
    const memberCountsPromise = supabase
      .from("memberships")
      .select("club_id")
      .in("club_id", clubIds)
      .eq("status", "active");

    // 3. Upcoming event counts per club — parallel
    const nowIso = new Date().toISOString();
    const eventCountsPromise = supabase
      .from("events")
      .select("club_id")
      .in("club_id", clubIds)
      .eq("status", "upcoming")
      .gte("start_time", nowIso);

    const [
      { data: memberRows, error: mcErr },
      { data: eventRows, error: ecErr },
    ] = await Promise.all([memberCountsPromise, eventCountsPromise]);

    if (mcErr) console.error('[membershipService] member count error:', mcErr);
    if (ecErr) console.error('[membershipService] event count error:', ecErr);

    const memberCountByClub = (memberRows || []).reduce((acc, r) => {
      acc[r.club_id] = (acc[r.club_id] || 0) + 1;
      return acc;
    }, {});

    const eventCountByClub = (eventRows || []).reduce((acc, r) => {
      acc[r.club_id] = (acc[r.club_id] || 0) + 1;
      return acc;
    }, {});

    // 4. Merge into a flat shape the UI can consume directly
    return mems.map((m) => {
      const club = m.clubs || {};
      const term = m.club_terms || null;
      return {
        membershipId: m.id,
        clubId: m.club_id,
        position: m.position,
        joinedAt: m.joined_at,
        term,
        club: {
          ...club,
          category: club.categories || null,
        },
        memberCount: memberCountByClub[m.club_id] || 0,
        upcomingEventCount: eventCountByClub[m.club_id] || 0,
      };
    });
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
