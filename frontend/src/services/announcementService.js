import { supabase } from "./supabase";
import { mockData } from "./mockData";
import { RequestTimeoutError } from "./supabase";

/* DELETE_MOCK_FALLBACK: when backend is stable, drop the mockData
   import + this helper + every withFallback wrapper in this file. */
const USE_MOCK_FALLBACK = true;

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
  // Fast path: skip the Supabase call while the backend is unstable.
  if (USE_MOCK_FALLBACK) {
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
    console.warn("[announcements.fallback] backend unreachable — using mock:", err?.message || err);
    return fallbackFn();
  }
}

export const announcementService = {
  // Fetch announcements visible to the user
  // If clubId is provided, returns announcements for that club as well as public manager announcements.
  // Otherwise, returns public manager announcements only.
  async getAnnouncements(clubId = null) {
    return withFallback(
      () => {
        let query = supabase
          .from("announcements")
          .select(`
            *,
            profiles (
              id,
              full_name,
              avatar_url
            ),
            clubs (
              id,
              name,
              logo_url
            )
          `);

        if (clubId) {
          query = query.or(`club_id.eq.${clubId},club_id.is.null`);
        } else {
          query = query.is("club_id", null);
        }

        return withTimeout(
          query
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false }),
          "announcements.getAnnouncements"
        ).then(({ data, error }) => {
          if (error) throw error;
          return data;
        });
      },
      () => mockData.getAnnouncements(clubId)
    );
  },

  // Fetch announcement by ID
  async getAnnouncementById(announcementId) {
    const { data, error } = await supabase
      .from("announcements")
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        ),
        clubs (
          id,
          name
        )
      `)
      .eq("id", announcementId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new announcement
  async createAnnouncement(announcementData) {
    const { data, error } = await supabase
      .from("announcements")
      .insert([announcementData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update an announcement
  async updateAnnouncement(announcementId, announcementData) {
    const { data, error } = await supabase
      .from("announcements")
      .update({ ...announcementData, updated_at: new Date() })
      .eq("id", announcementId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete an announcement
  async deleteAnnouncement(announcementId) {
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId);

    if (error) throw error;
    return true;
  }
};
