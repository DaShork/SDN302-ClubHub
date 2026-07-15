import { supabase } from "./supabase";
import { USE_MOCK_FALLBACK } from "./supabase";

/* USE_MOCK_FALLBACK is read from the VITE_USE_MOCK_FALLBACK env var via
 * ./supabase. Default: OFF. Set `VITE_USE_MOCK_FALLBACK=true` in
 * `frontend/.env` to bypass Supabase and serve mock data instead.
 *
 * DELETE_MOCK_FALLBACK: drop this constant + the MOCK_* arrays + every
 * branch that mutates them. */
const useMock = USE_MOCK_FALLBACK;

function withFallback(label, fallbackFn) {
  if (useMock) {
    return fallbackFn();
  }
  try {
    return label();
  } catch (err) {
    console.warn("[joinRequest] fallback:", err?.message || err);
    return fallbackFn();
  }
}

export const joinRequestService = {
  // ==================== CLUB JOIN REQUESTS ====================

  /**
   * Submit a join request for a club
   */
  async submitClubRequest({ clubId, profileId, fullName, studentCode, email, phone, motivation }) {
    return withFallback(
      () =>
        supabase
          .from("join_requests")
          .insert([{
            club_id: clubId,
            profile_id: profileId,
            type: "club",
            full_name: fullName,
            student_code: studentCode,
            email: email,
            phone: phone || null,
            motivation: motivation || null,
            status: "pending"
          }])
          .select()
          .single(),
      () => {
        const newRequest = {
          id: `mock-${Date.now()}`,
          club_id: clubId,
          profile_id: profileId,
          type: "club",
          full_name: fullName,
          student_code: studentCode,
          email: email,
          phone: phone,
          motivation: motivation,
          status: "pending",
          created_at: new Date().toISOString()
        };
        return { data: newRequest, error: null };
      }
    );
  },

  /**
   * Get join requests for a club (for leaders)
   */
  async getClubRequests(clubId, { status = null } = {}) {
    return withFallback(
      () =>
        supabase
          .from("join_requests")
          .select(`
            *,
            profiles (id, full_name, email, avatar_url, student_code)
          `)
          .eq("club_id", clubId)
          .eq("type", "club")
          .order("created_at", { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            if (status) {
              return { data: data?.filter(r => r.status === status) || [], error: null };
            }
            return { data: data || [], error: null };
          }),
      () => {
        // Mock fallback: no persistence layer, return empty list
        return { data: [], error: null };
      }
    );
  },

  /**
   * Get pending request count for a club
   */
  async getClubRequestCount(clubId) {
    return withFallback(
      () =>
        supabase
          .from("join_requests")
          .select("id", { count: "exact", head: true })
          .eq("club_id", clubId)
          .eq("type", "club")
          .eq("status", "pending"),
      () => 0
    ).then(result => result?.count ?? result ?? 0);
  },

  /**
   * Approve a club join request
   */
  async approveClubRequest(requestId) {
    return withFallback(
      () =>
        supabase
          .from("join_requests")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .eq("id", requestId)
          .select()
          .single()
          .then(async ({ data, error }) => {
            if (error) throw error;
            // Also create membership
            if (data) {
              await supabase
                .from("memberships")
                .insert([{
                  club_id: data.club_id,
                  profile_id: data.profile_id,
                  position: "Member",
                  status: "active"
                }]);
            }
            return { data, error: null };
          }),
      () => ({ data: null, error: null })
    );
  },

  /**
   * Reject a club join request
   */
  async rejectClubRequest(requestId, reason = null) {
    return withFallback(
      () =>
        supabase
          .from("join_requests")
          .update({
            status: "rejected",
            rejection_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq("id", requestId)
          .select()
          .single(),
      () => ({ data: null, error: null })
    );
  },

  /**
   * Get user's club join request status
   */
  async getUserClubRequest(profileId, clubId) {
    return withFallback(
      () =>
        supabase
          .from("join_requests")
          .select("*")
          .eq("profile_id", profileId)
          .eq("club_id", clubId)
          .eq("type", "club")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      () => null
    );
  },

  /**
   * Get user's all club requests
   */
  async getUserClubRequests(profileId) {
    return withFallback(
      () =>
        supabase
          .from("join_requests")
          .select(`
            *,
            clubs (id, name, logo_url)
          `)
          .eq("profile_id", profileId)
          .eq("type", "club")
          .order("created_at", { ascending: false }),
      () => ({ data: [], error: null })
    );
  },

  // ==================== EVENT REGISTRATION REQUESTS ====================

  /**
   * Submit a registration request for an event
   */
  async submitEventRequest({ eventId, clubId, profileId, fullName, studentCode, email, phone, notes }) {
    return withFallback(
      () =>
        supabase
          .from("event_requests")
          .insert([{
            event_id: eventId,
            club_id: clubId,
            profile_id: profileId,
            full_name: fullName,
            student_code: studentCode,
            email: email,
            phone: phone || null,
            notes: notes || null,
            status: "pending"
          }])
          .select()
          .single(),
      () => {
        const newRequest = {
          id: `mock-evt-${Date.now()}`,
          event_id: eventId,
          club_id: clubId,
          profile_id: profileId,
          full_name: fullName,
          student_code: studentCode,
          email: email,
          phone: phone,
          notes: notes,
          status: "pending",
          created_at: new Date().toISOString()
        };
        return { data: newRequest, error: null };
      }
    );
  },

  /**
   * Get event registration requests (for event managers)
   */
  async getEventRequests(eventId, { status = null } = {}) {
    return withFallback(
      () =>
        supabase
          .from("event_requests")
          .select(`
            *,
            profiles (id, full_name, email, avatar_url, student_code)
          `)
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            if (status) {
              return { data: data?.filter(r => r.status === status) || [], error: null };
            }
            return { data: data || [], error: null };
          }),
      () => ({ data: [], error: null })
    );
  },

  /**
   * Get event request count by status
   */
  async getEventRequestStats(eventId) {
    return withFallback(
      () =>
        Promise.all([
          supabase.from("event_requests").select("id", { count: "exact", head: true }).eq("event_id", eventId),
          supabase.from("event_requests").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "pending"),
          supabase.from("event_requests").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "approved"),
          supabase.from("event_requests").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "rejected")
        ]).then(([total, pending, approved, rejected]) => ({
          total: total.count || 0,
          pending: pending.count || 0,
          approved: approved.count || 0,
          rejected: rejected.count || 0
        })),
      () => ({ total: 0, pending: 0, approved: 0, rejected: 0 })
    );
  },

  /**
   * Approve an event registration request
   */
  async approveEventRequest(requestId) {
    return withFallback(
      () =>
        supabase
          .from("event_requests")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .eq("id", requestId)
          .select()
          .single()
          .then(async ({ data, error }) => {
            if (error) throw error;
            // Also create event registration
            if (data) {
              const qrCode = `CHB-${data.event_id?.slice(0, 6) || 'EVT'}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
              await supabase
                .from("event_registrations")
                .upsert([{
                  event_id: data.event_id,
                  profile_id: data.profile_id,
                  status: "registered",
                  qr_code: qrCode
                }], { onConflict: "event_id,profile_id" });
            }
            return { data, error: null };
          }),
      () => ({ data: null, error: null })
    );
  },

  /**
   * Reject an event registration request
   */
  async rejectEventRequest(requestId, reason = null) {
    return withFallback(
      () =>
        supabase
          .from("event_requests")
          .update({
            status: "rejected",
            rejection_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq("id", requestId)
          .select()
          .single(),
      () => ({ data: null, error: null })
    );
  },

  /**
   * Get user's event registration request status
   */
  async getUserEventRequest(profileId, eventId) {
    return withFallback(
      () =>
        supabase
          .from("event_requests")
          .select("*")
          .eq("profile_id", profileId)
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      () => null
    );
  },

  /**
   * Get user's all event requests
   */
  async getUserEventRequests(profileId) {
    return withFallback(
      () =>
        supabase
          .from("event_requests")
          .select(`
            *,
            events (id, title, start_time, clubs (id, name))
          `)
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false }),
      () => ({ data: [], error: null })
    );
  }
};
