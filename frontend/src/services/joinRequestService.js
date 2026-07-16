import { supabase } from "./supabase";
import { USE_MOCK_FALLBACK } from "./supabase";
import { createNotificationWithLink } from "./notificationService";

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
    // Fetch club info first (needed for notifications)
    const [{ data: clubData }, result] = await Promise.all([
      supabase.from("clubs").select("name, leader_id").eq("id", clubId).maybeSingle(),
      withFallback(
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
      ),
    ]);

    if (result?.data && clubData) {
      const clubName = clubData.name || "CLB";
      // Notify the student (request sent)
      await createNotificationWithLink({
        profileId,
        title: "Yêu cầu gia nhập đã gửi",
        content: `Bạn đã gửi yêu cầu tham gia ${clubName}. Đang chờ duyệt.`,
        type: "membership",
        linkUrl: "/my-clubs",
      }).catch(() => {});
      // Notify the club leader (new request to review)
      if (clubData.leader_id && clubData.leader_id !== profileId) {
        await createNotificationWithLink({
          profileId: clubData.leader_id,
          title: "Yêu cầu tham gia mới",
          content: `${fullName} (${studentCode}) muốn tham gia ${clubName}.`,
          type: "membership",
          linkUrl: `/leader/members?club=${clubId}&tab=requests`,
        }).catch(() => {});
      }
    }
    return result;
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
   * Approve a club join request + notify the student
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
            if (data) {
              // Create membership
              await supabase
                .from("memberships")
                .insert([{
                  club_id: data.club_id,
                  profile_id: data.profile_id,
                  position: "Member",
                  status: "active"
                }]);

              // Update user role to Club Member (only if currently Student or has no role)
              const { data: profileData } = await supabase
                .from("profiles")
                .select("id, role_id, roles(name)")
                .eq("id", data.profile_id)
                .maybeSingle();
              
              if (profileData) {
                const currentRole = profileData.roles?.name;
                // Only upgrade if user is Student or has no elevated role
                const lowerRoles = ['Student', null, undefined];
                if (lowerRoles.includes(currentRole)) {
                  const { data: clubMemberRole } = await supabase
                    .from("roles")
                    .select("id")
                    .eq("name", "Club Member")
                    .maybeSingle();
                  
                  if (clubMemberRole?.id) {
                    await supabase
                      .from("profiles")
                      .update({ role_id: clubMemberRole.id })
                      .eq("id", data.profile_id);
                  }
                }
              }

              // Notify the student
              const { data: clubData } = await supabase
                .from("clubs")
                .select("name")
                .eq("id", data.club_id)
                .maybeSingle();
              const clubName = clubData?.name || "CLB";
              await createNotificationWithLink({
                profileId: data.profile_id,
                title: "Yêu cầu tham gia được duyệt!",
                content: `Bạn đã trở thành thành viên của ${clubName}.`,
                type: "membership",
                linkUrl: "/member/clubs",
              });
            }
            return { data, error: null };
          }),
      () => ({ data: null, error: null })
    );
  },

  /**
   * Reject a club join request + notify the student with the reason
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
          .single()
          .then(async ({ data, error }) => {
            if (error) throw error;
            if (data) {
              // Notify the student with rejection reason
              const { data: clubData } = await supabase
                .from("clubs")
                .select("name")
                .eq("id", data.club_id)
                .maybeSingle();
              const clubName = clubData?.name || "CLB";
              const reasonText = reason
                ? ` Lý do: ${reason}`
                : "";
              await createNotificationWithLink({
                profileId: data.profile_id,
                title: "Yêu cầu tham gia bị từ chối",
                content: `Yêu cầu tham gia ${clubName} đã bị từ chối.${reasonText}`,
                type: "membership",
                linkUrl: "/my-clubs",
              });
            }
            return { data, error: null };
          }),
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
    const { data: eventRow } = await supabase
      .from("events")
      .select("requires_approval, title, club_id")
      .eq("id", eventId)
      .maybeSingle();

    const initialStatus = eventRow?.requires_approval ? "pending" : "approved";

    const result = await withFallback(
      () =>
        supabase
          .from("event_requests")
          .upsert(
            [{
              event_id: eventId,
              club_id: clubId,
              profile_id: profileId,
              full_name: fullName,
              student_code: studentCode,
              email: email,
              phone: phone || null,
              notes: notes || null,
              status: initialStatus,
            }],
            { onConflict: "event_id,profile_id" }
          )
          .select()
          .single(),
      () => ({
        data: {
          id: `mock-evt-${Date.now()}`,
          event_id: eventId,
          club_id: clubId,
          profile_id: profileId,
          full_name: fullName,
          student_code: studentCode,
          email: email,
          phone: phone,
          notes: notes,
          status: initialStatus,
          created_at: new Date().toISOString(),
        },
        error: null,
      })
    );

    if (result?.data && eventRow) {
      const eventTitle = eventRow.title || "sự kiện";
      const targetClubId = eventRow.club_id || clubId;
      const isAutoApproved = initialStatus === "approved";
      await createNotificationWithLink({
        profileId,
        title: isAutoApproved
          ? "Đăng ký sự kiện thành công"
          : "Yêu cầu đăng ký sự kiện đã gửi",
        content: isAutoApproved
          ? `Bạn đã đăng ký tham gia "${eventTitle}" thành công.`
          : `Bạn đã đăng ký tham gia "${eventTitle}". Đang chờ duyệt.`,
        type: "event",
        linkUrl: "/my-registrations",
      }).catch(() => {});
      if (!isAutoApproved && targetClubId) {
        const { data: clubData } = await supabase
          .from("clubs").select("leader_id").eq("id", targetClubId).maybeSingle();
        if (clubData?.leader_id && clubData.leader_id !== profileId) {
          await createNotificationWithLink({
            profileId: clubData.leader_id,
            title: "Yêu cầu đăng ký sự kiện mới",
            content: `${fullName} (${studentCode}) muốn đăng ký sự kiện "${eventTitle}".`,
            type: "event",
            linkUrl: `/leader/events?club=${targetClubId}`,
          }).catch(() => {});
        }
      }
    }
    return result;
  },

  /**
   * Cancel a pending event_request for the current user.
   * DB trigger syncs the cancellation to event_registrations.
   */
  async cancelEventRequestByUser(profileId, eventId) {
    if (!profileId || !eventId) throw new Error("missing args");
    return withFallback(
      () =>
        supabase
          .from("event_requests")
          .update({ status: "cancelled" })
          .eq("profile_id", profileId)
          .eq("event_id", eventId)
          .eq("status", "pending"),
      () => ({ data: null, error: null })
    );
  },

  /**
   * Get event registration requests (for event managers).
   * Returns a plain array — callers expect `requests.map(...)`.
   */
  async getEventRequests(eventId, { status = null } = {}) {
    const { data } = await withFallback(
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
            return data || [];
          }),
      () => []
    );
    if (!Array.isArray(data)) return [];
    return status ? data.filter((r) => r.status === status) : data;
  },

  /**
   * Get the current user's single event request row.
   * Returns a plain object (or null) — callers expect `.status` / `.id`.
   */
  async getUserEventRequest(profileId, eventId) {
    if (!profileId || !eventId) return null;
    const data = await withFallback(
      () =>
        supabase
          .from("event_requests")
          .select("*")
          .eq("profile_id", profileId)
          .eq("event_id", eventId)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) throw error;
            return data || null;
          }),
      () => null
    );
    return data ?? null;
  },

  /**
   * List every event request the user has ever submitted (used in
   * /my-registrations / MemberDashboard). Returns array of objects.
   */
  async getUserEventRequests(profileId) {
    if (!profileId) return [];
    const data = await withFallback(
      () =>
        supabase
          .from("event_requests")
          .select(`
            *,
            events (*, clubs (id, name, logo_url))
          `)
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return data || [];
          }),
      () => []
    );
    return Array.isArray(data) ? data : [];
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
   * Approve an event registration request.
   * The DB trigger `sync_event_request_to_registration` mirrors the
   * approval into `event_registrations` automatically (status='registered').
   */
  async approveEventRequest(requestId) {
    const result = await withFallback(
      () =>
        supabase
          .from("event_requests")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .eq("id", requestId)
          .select()
          .single(),
      () => null
    );
    if (result?.profile_id) {
      const { data: eventData } = await supabase
        .from("events")
        .select("title")
        .eq("id", result.event_id)
        .maybeSingle();
      await createNotificationWithLink({
        profileId: result.profile_id,
        title: "Đăng ký sự kiện được duyệt!",
        content: `Yêu cầu đăng ký sự kiện "${eventData?.title || "sự kiện"}" đã được duyệt.`,
        type: "event",
        linkUrl: "/my-registrations",
      });
    }
    return { data: result, error: null };
  },

  /**
   * Reject an event registration request + notify the student
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
          .single()
          .then(async ({ data, error }) => {
            if (error) throw error;
            if (data) {
              const { data: eventData } = await supabase
                .from("events")
                .select("title")
                .eq("id", data.event_id)
                .maybeSingle();
              const eventTitle = eventData?.title || "sự kiện";
              const reasonText = reason ? ` Lý do: ${reason}` : "";
              await createNotificationWithLink({
                profileId: data.profile_id,
                title: "Đăng ký sự kiện bị từ chối",
                content: `Yêu cầu đăng ký sự kiện "${eventTitle}" đã bị từ chối.${reasonText}`,
                type: "event",
                linkUrl: "/my-registrations",
              });
            }
            return { data, error: null };
          }),
      () => ({ data: null, error: null })
    );
  }
};
