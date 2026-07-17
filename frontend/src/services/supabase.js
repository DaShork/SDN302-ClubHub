import { createClient } from "@supabase/supabase-js";
import { mockData } from "./mockData";

/* ----------------------------------------------------------------------------
 * USE_MOCK_FALLBACK — temporary toggle for offline / broken-backend development.
 *
 * Default: OFF. Set `VITE_USE_MOCK_FALLBACK=true` in `frontend/.env` to force
 * every service to short-circuit and return data from `./mockData` instead of
 * touching Supabase. When the backend is stable, leave it unset (or set it to
 * `false`) and every service hits Supabase normally.
 *
 * Tracked under DELETE_MOCK_FALLBACK — when the project stops needing offline
 * development, delete the env var, this constant, the mockData import, and
 * every wrapper that calls `fallbackFn()`.
 * -------------------------------------------------------------------------- */
const envValue = import.meta.env.VITE_USE_MOCK_FALLBACK;
export const USE_MOCK_FALLBACK =
  typeof envValue === "string" && envValue.toLowerCase() === "true";

function mockUuidForSlug(slugOrUuid) {
  if (!slugOrUuid) return null;
  const club = mockData.getClubById(slugOrUuid);
  return club?.id || null;
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ----------------------------------------------------------------------------
 * Network failure hardening.
 *
 * Why this exists:
 *   When the user's internet connection drops mid-request, Supabase JS does
 *   NOT always reject the promise. In some code paths (e.g. when the fetch
 *   resolves with `net::ERR_INTERNET_DISCONNECTED` *before* supabase-js has
 *   attached its response handlers), the promise hangs forever, leaving
 *   every page stuck on its <Loading /> spinner.
 *
 *   We solve this by attaching an AbortController with a hard timeout to
 *   every request. If the request takes longer than REQUEST_TIMEOUT_MS, we
 *   abort it and the caller gets a clean `RequestTimeoutError` that the
 *   UI can degrade gracefully (show empty state / retry button).
 * -------------------------------------------------------------------------- */
export const REQUEST_TIMEOUT_MS = 8000;

export class RequestTimeoutError extends Error {
  constructor(message = "Supabase request timed out") {
    super(message);
    this.name = "RequestTimeoutError";
    this.code = "REQUEST_TIMEOUT";
  }
}

/**
 * Wrap a `supabase.from(table)` builder such that the eventual `.select()`
 * call always gets an AbortSignal that aborts after REQUEST_TIMEOUT_MS.
 *
 * @param {Function} builderFn  e.g. (q) => q.select('id').eq('status', 'active')
 * @returns {Promise} the same `.then / .catch` chain as the original builder
 */
export async function safeQuery(builderFn) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    // `builderFn` returns a PostgrestFilterBuilder. The .abortSignal()
    // method is available on it (supabase-js >= v2.x).
    const builder = builderFn(supabase);
    if (builder && typeof builder.abortSignal === "function") {
      builder.abortSignal(controller.signal);
    }
    const result = await builder;
    if (controller.signal.aborted) {
      // We won the race — the abort fired before the response arrived. Treat
      // it the same as a timeout so callers can catch a single error type.
      throw new RequestTimeoutError();
    }
    return result;
  } catch (err) {
    // Normalise "aborted" errors into RequestTimeoutError for cleaner UI
    if (
      err?.name === "AbortError" ||
      err?.message?.includes("aborted") ||
      err?.message?.includes("Failed to fetch") ||
      err?.message?.includes("NetworkError") ||
      err?.message?.includes("ERR_INTERNET_DISCONNECTED")
    ) {
      throw new RequestTimeoutError(
        err.message || "Network unavailable"
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Resolves a UUID from a club slug (e.g. "f-code" -> UUID of club "F-Code")
 * If the input is already a valid UUID, returns it directly.
 *
 * Implementation note: we DON'T do a `from('clubs').select('id, name')` here.
 * That would pull the entire clubs table and slow down / hang under RLS for
 * anon users. Instead we fetch the minimum needed set (slug, id, name) and
 * filter client-side — this keeps the query bounded to ~100 rows max.
 *
 * Network hardening: the underlying call uses `safeQuery()` so a lost
 * connection surfaces as `null` within ~8s instead of hanging forever.
 */
export async function resolveClubUuid(slugOrUuid) {
  if (!slugOrUuid) return null;

  // Check if already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slugOrUuid)) {
    return slugOrUuid;
  }

  // DELETE_MOCK_FALLBACK: drop this fast-path branch when backend is stable.
  if (USE_MOCK_FALLBACK) {
    return mockUuidForSlug(slugOrUuid);
  }

  try {
    /* Fetch a bounded set — slug + id + name only — and filter in-memory.
       For > 100 clubs this should be reworked to use a server-side ilike
       query, but for MVP scale this is fine and avoids the full-table scan. */
    const { data, error } = await safeQuery((sb) =>
      sb
        .from("clubs")
        .select("id, slug, name")
        .eq("status", "active")
        .limit(200)
    );

    if (error || !data) {
      return null;
    }

    const cleanSlug = slugOrUuid.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Attempt slug match first
    const bySlug = data.find((c) => c.slug?.toLowerCase() === slugOrUuid.toLowerCase());
    if (bySlug) return bySlug.id;

    // Then fuzzy name match
    const byName = data.find((c) => {
      const cleanName = (c.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return cleanName.includes(cleanSlug) || cleanSlug.includes(cleanName);
    });

    return byName ? byName.id : null;
  } catch (err) {
    // DELETE_MOCK_FALLBACK: drop the mock branch when backend is stable.
    if (USE_MOCK_FALLBACK) {
      return mockUuidForSlug(slugOrUuid);
    }
    console.error("Error resolving club UUID in supabase.js:", err);
    return null;
  }
}

/* ----------------------------------------------------------------------------
 * Connection state listeners.
 *
 * Some browsers can fire these when connectivity drops. Pages can subscribe
 * to `onConnectionChange` to surface a banner / refresh prompt instead of
 * leaving the user stuck on a loading spinner.
 * -------------------------------------------------------------------------- */
export function onConnectionChange(handler) {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => handler?.(true);
  const handleOffline = () => handler?.(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
