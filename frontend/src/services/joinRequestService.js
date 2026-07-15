import { supabase } from "./supabase";

/* Join Request Service - Handles club and event join/registration requests
   with approval workflow. */

const USE_MOCK_FALLBACK = true;

// Mock data for development
const MOCK_JOIN_REQUESTS = [];
const MOCK_EVENT_REQUESTS = [];

function withFallback(label, fallbackFn) {
  if (USE_MOCK_FALLBACK) {
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
          id: `req-${Date.now()}`,
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
        MOCK_JOIN_REQUESTS.push(newRequest);
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
        const filtered = status
          ? MOCK_JOIN_REQUESTS.filter(r => r.club_id === clubId && r.status === status)
          : MOCK_JOIN_REQUESTS.filter(r => r.club_id === clubId);
        return { data: filtered, error: null };
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
      () => MOCK_JOIN_REQUESTS.filter(r => r.club_id === clubId && r.status === "pending").length
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
      () => {
        const req = MOCK_JOIN_REQUESTS.find(r => r.id === requestId);
        if (req) {
          req.status = "approved";
          req.updated_at = new Date().toISOString();
        }
        return { data: req, error: null };
      }
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
      () => {
        const req = MOCK_JOIN_REQUESTS.find(r => r.id === requestId);
        if (req) {
          req.status = "rejected";
          req.rejection_reason = reason;
          req.updated_at = new Date().toISOString();
        }
        return { data: req, error: null };
      }
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
      () => MOCK_JOIN_REQUESTS.find(r => r.profile_id === profileId && r.club_id === clubId)
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
      () => MOCK_JOIN_REQUESTS.filter(r => r.profile_id === profileId)
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
          id: `evtreq-${Date.now()}`,
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
        MOCK_EVENT_REQUESTS.push(newRequest);
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
      () => {
        const filtered = status
          ? MOCK_EVENT_REQUESTS.filter(r => r.event_id === eventId && r.status === status)
          : MOCK_EVENT_REQUESTS.filter(r => r.event_id === eventId);
        return { data: filtered, error: null };
      }
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
      () => {
        const requests = MOCK_EVENT_REQUESTS.filter(r => r.event_id === eventId);
        return {
          total: requests.length,
          pending: requests.filter(r => r.status === "pending").length,
          approved: requests.filter(r => r.status === "approved").length,
          rejected: requests.filter(r => r.status === "rejected").length
        };
      }
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
      () => {
        const req = MOCK_EVENT_REQUESTS.find(r => r.id === requestId);
        if (req) {
          req.status = "approved";
          req.updated_at = new Date().toISOString();
        }
        return { data: req, error: null };
      }
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
      () => {
        const req = MOCK_EVENT_REQUESTS.find(r => r.id === requestId);
        if (req) {
          req.status = "rejected";
          req.rejection_reason = reason;
          req.updated_at = new Date().toISOString();
        }
        return { data: req, error: null };
      }
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
      () => MOCK_EVENT_REQUESTS.find(r => r.profile_id === profileId && r.event_id === eventId)
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
      () => MOCK_EVENT_REQUESTS.filter(r => r.profile_id === profileId)
    );
  }
};
