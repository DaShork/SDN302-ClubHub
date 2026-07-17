import { supabase } from "./supabase";
import { USE_MOCK_FALLBACK } from "./supabase";
import { mockData } from "./mockData";
import { RequestTimeoutError } from "./supabase";

/* USE_MOCK_FALLBACK is read from the VITE_USE_MOCK_FALLBACK env var via
 * ./supabase. Default: OFF. Set `VITE_USE_MOCK_FALLBACK=true` in
 * `frontend/.env` to bypass Supabase and serve mock data instead.
 *
 * DELETE_MOCK_FALLBACK: drop the mockData import + this constant + every
 * withFallback wrapper in this file. */
const useMock = USE_MOCK_FALLBACK;

function withTimeout(promise, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new RequestTimeoutError(`${label} timed out`));
    }, 8000);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => {
        clearTimeout(t);
        if (
          e?.name === "AbortError" ||
          e?.message?.includes("aborted") ||
          e?.message?.includes("Failed to fetch") ||
          e?.message?.includes("NetworkError") ||
          e?.message?.includes("ERR_INTERNET_DISCONNECTED")
        ) {
          reject(new RequestTimeoutError(e.message || `${label} network error`));
          return;
        }
        reject(e);
      }
    );
  });
}

async function withFallback(label, fallbackFn) {
  // Fast path: skip the Supabase call entirely while the backend is
  // unstable. Saves an 8s hang on every page load. When VITE_USE_MOCK_FALLBACK
  // is unset (default), every call hits the real API.
  if (useMock) {
    return fallbackFn();
  }
  try {
    return await label();
  } catch (err) {
    const isNetErr =
      err instanceof RequestTimeoutError ||
      err?.name === "AbortError" ||
      err?.message?.includes("Failed to fetch") ||
      err?.message?.includes("NetworkError") ||
      err?.message?.includes("aborted") ||
      err?.message?.includes("ERR_INTERNET_DISCONNECTED");
    if (!isNetErr) throw err;
    // eslint-disable-next-line no-console
    console.warn("[events.fallback] backend unreachable — using mock:", err?.message || err);
    return fallbackFn();
  }
}

// Mock data for events
const MOCK_EVENTS = [
  {
    id: "mock-ev-1",
    club_id: "fcode-id",
    title: "React 19 & Next.js 15 Seminar",
    description: "Join us for an in-depth seminar on the latest React 19 features including Server Actions, the new use() hook, and Next.js 15 App Router optimizations. Essential for modern web developers.",
    start_time: "2026-07-20T13:30:00+07:00",
    end_time: "2026-07-20T16:30:00+07:00",
    location: "Beta Building, Room 204",
    max_participants: 100,
    status: "upcoming",
    banner_url: "",
    clubs: { id: "fcode-id", name: "F-Code", slug: "fcode", logo_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop" }
  },
  {
    id: "mock-ev-2",
    club_id: "fcode-id",
    title: "TailwindCSS v4 Workshop",
    description: "A hands-on workshop focused on transitioning to TailwindCSS v4. We will cover the new Rust-based compiler engine, Vite plugin integration, and advanced configuration options.",
    start_time: "2026-07-28T08:00:00+07:00",
    end_time: "2026-07-28T18:00:00+07:00",
    location: "ALAGRE Space",
    max_participants: 40,
    status: "upcoming",
    banner_url: "",
    clubs: { id: "fcode-id", name: "F-Code", slug: "fcode", logo_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop" }
  },
  {
    id: "mock-ev-3",
    club_id: "fcode-id",
    title: "ICPC Training Week 4",
    description: "Intensive DP & graph algorithms practice session.",
    start_time: "2026-07-25T08:00:00+07:00",
    end_time: "2026-07-25T17:00:00+07:00",
    location: "FPTU HCMC - Lab 5",
    max_participants: 40,
    status: "upcoming",
    banner_url: "",
    clubs: { id: "fcode-id", name: "F-Code", slug: "fcode", logo_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop" }
  }
];

export const eventService = {
  /**
   * Get upcoming events for the homepage.
   * Returns events with status='upcoming' ordered by start_time, limited to N.
   * Joins club info and registration count in a single query.
   */
  async getFeatured(limit = 6) {
    return withFallback(
      () =>
        withTimeout(
          supabase
            .from("events")
            .select(`
              id, title, description, location, banner_url,
              start_time, end_time, status, approval_status,
              clubs ( id, name, slug, logo_url )
            `)
            .eq("status", "upcoming")
            .eq("approval_status", "approved")
            .gte("start_time", new Date().toISOString())
            .order("start_time", { ascending: true })
            .limit(limit),
          "events.getFeatured"
        ).then(({ data, error }) => {
          if (error) throw error;
          return data || [];
        }),
      () => MOCK_EVENTS.slice(0, limit).map((e) => ({ ...e, registrationCount: 0 }))
    ).then((data) => {
      // Add registration counts for mock data
      return data.map(e => ({
        ...e,
        registrationCount: e.registrationCount || 0
      }));
    });
  },

  async getClubEvents(clubId, limit = 50) {
    return withFallback(
      () =>
        withTimeout(
          (async () => {
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
            if (!data?.length) return [];

            // Attach registrationCount per event.
            const ids = data.map((e) => e.id);
            const { data: counts } = await supabase
              .from("event_registrations")
              .select("event_id")
              .in("event_id", ids)
              .in("status", ["pending", "registered", "checked_in"]);

            const countMap = {};
            (counts || []).forEach((r) => {
              countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
            });
            return data.map((e) => ({
              ...e,
              registrationCount: countMap[e.id] || 0,
            }));
          })(),
          "events.getClubEvents"
        ),
      () => {
        // Mock fallback: deterministic 0 so remainingSlots is never lying.
        return mockData.getEventsByClub(clubId).map((e) => ({
          ...e,
          registrationCount: 0,
        }));
      }
    );
  },

  async getById(id) {
    return withFallback(
      () =>
        withTimeout(
          (async () => {
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
            if (!data) return null;

            const { count, error: cntErr } = await supabase
              .from("event_registrations")
              .select("id", { count: "exact", head: true })
              .eq("event_id", id)
              .in("status", ["pending", "registered", "checked_in"]);
            if (cntErr) console.warn("registrationCount fetch failed:", cntErr);
            return { ...data, registrationCount: count || 0 };
          })(),
          "events.getById"
        ),
      () => {
        // Match by id (UUID or mock id). Fallback to the first mock event
        // so /events/<any unknown id> renders an honest "no such event"
        // empty state instead of pretending a different event is the one
        // requested. ClubDetailPage already handles null gracefully.
        const mockEvent = MOCK_EVENTS.find((e) => e.id === id);
        return mockEvent ? { ...mockEvent, registrationCount: 0 } : null;
      }
    );
  },

  async getByClub(clubId, limit = 50) {
    return this.getClubEvents(clubId, limit);
  },

  /**
   * Get all public events for the events listing page.
   * Returns all events ordered by start_time, with club info and registration counts.
   */
  async getAll({ limit = 50, status = null } = {}) {
    return withFallback(
      () =>
        withTimeout(
          (async () => {
            let query = supabase
              .from("events")
              .select(`
                id, title, description, location, banner_url,
                start_time, end_time, status, max_participants, approval_status,
                clubs ( id, name, slug, logo_url )
              `)
              .eq("approval_status", "approved")
              .order("start_time", { ascending: false })
              .limit(limit);

            if (status) {
              query = query.eq("status", status);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data?.length) return [];

            // Fetch registration counts
            const ids = data.map((e) => e.id);
            const { data: counts } = await supabase
              .from("event_registrations")
              .select("event_id", { count: "exact", head: false })
              .in("event_id", ids)
              .neq("status", "cancelled");

            const countMap = {};
            (counts || []).forEach((r) => {
              countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
            });

            return data.map((e) => ({
              ...e,
              registrationCount: countMap[e.id] || 0,
            }));
          })(),
          "events.getAll"
        ),
      () => MOCK_EVENTS.map((e) => ({ ...e, registrationCount: 0 }))
    );
  },

  async getRegistrationCount(eventId) {
    return withFallback(
      () =>
        withTimeout(
          supabase
            .from("event_registrations")
            .select("id", { count: "exact", head: true })
            .eq("event_id", eventId)
            // Includes pending so the leader sees accurate "sắp đầy" signal;
            // excludes cancelled so dropped-out seats free up.
            .in("status", ["pending", "registered", "checked_in"]),
          "events.getRegistrationCount"
        ).then(({ count, error }) => {
          if (error) throw error;
          return count || 0;
        }),
      // Deterministic fallback: 0 (so the page does not display a misleading
      // random number when the backend is offline).
      () => 0
    );
  },

  /**
   * Soft-cancel the caller's own registration.
   * Mirrors to the corresponding `join_requests` row via the DB trigger
   * `trg_sync_event_reg_cancel` so the two tables never drift.
   */
  async cancelEventRegistration(eventId, profileId) {
    if (!eventId || !profileId) throw new Error("missing args");
    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("event_id", eventId)
      .eq("profile_id", profileId);
    if (error) throw error;
    return true;
  },

  /**
   * Cancels an *event_request* (the B-table) without touching the
   * event_registrations row directly. Use when a student wants to withdraw
   * before the leader reviews the request. The DB trigger will then mirror
   * the cancellation onto event_registrations.
   */
  async cancelEventRequestByUser(profileId, eventId) {
    if (!profileId || !eventId) throw new Error("missing args");
    const { error } = await supabase
      .from("join_requests")
      .update({ status: "cancelled" })
      .eq("profile_id", profileId)
      .eq("event_id", eventId)
      .eq("type", "event");
    if (error) throw error;
    return true;
  },

  /**
   * After a leader creates an event they sometimes want to be registered
   * automatically. Inserts a `registered` row with qr_code if the event
   * has `auto_register_creator = true`. Idempotent — re-running won't
   * duplicate.
   */
  async registerCreatorForEvent(eventId, creatorProfileId) {
    if (!eventId || !creatorProfileId) return null;
    const qrCode = `CHB-${String(eventId).slice(0, 6)}-${
      Math.random().toString(36).slice(2, 8).toUpperCase()
    }`;
    const { data, error } = await supabase
      .from("event_registrations")
      .upsert(
        [{
          event_id: eventId,
          profile_id: creatorProfileId,
          status: "registered",
          qr_code: qrCode,
        }],
        { onConflict: "event_id,profile_id" }
      )
      .select();
    if (error) throw error;
    return data?.[0] || null;
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
    return withFallback(
      () =>
        withTimeout(
          supabase
            .from("event_registrations")
            .select("id, status, qr_code")
            .eq("event_id", eventId)
            .eq("profile_id", profileId)
            // Ignore cancelled rows so callers can treat `data` as
            // "active or no registration" without re-checking.
            .neq("status", "cancelled")
            .maybeSingle(),
          "events.isUserRegistered"
        ).then((data, error) => {
          if (error) throw error;
          return data;
        }),
      () => null
    );
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

  // Student self-registers for an event when no join_request flow is needed.
  async registerForEvent(eventId, profileId) {
    const qrCode = `CHB-${String(eventId).slice(0, 6)}-${
      Math.random().toString(36).slice(2, 8).toUpperCase()
    }`;
    const { data, error } = await supabase
      .from("event_registrations")
      .upsert(
        [{
          event_id: eventId,
          profile_id: profileId,
          status: "registered",
          qr_code: qrCode,
        }],
        { onConflict: "event_id,profile_id" }
      )
      .select();

    if (error) throw error;
    return data?.[0];
  },

  // ── DANGER: ADMIN ONLY ────────────────────────────────────────────────────
  // Removes a registration row outright. Prefer `cancelEventRegistration`
  // (soft-cancel) for every UI path. This method exists for GDPR/admin
  // purge workflows and intentionally is not bound to any React component.
  async adminHardDeleteRegistration(eventId, profileId) {
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
