import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Resolves a UUID from a club slug (e.g. "f-code" -> UUID of club "F-Code")
 * If the input is already a valid UUID, returns it directly.
 */
export async function resolveClubUuid(slugOrUuid) {
  if (!slugOrUuid) return null;

  // Check if already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slugOrUuid)) {
    return slugOrUuid;
  }

  try {
    const { data, error } = await supabase.from("clubs").select("id, name");
    if (error || !data) return null;

    const cleanSlug = slugOrUuid.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Attempt fuzzy matching
    const match = data.find(c => {
      const cleanName = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return cleanName.includes(cleanSlug) || cleanSlug.includes(cleanName);
    });

    return match ? match.id : null;
  } catch (err) {
    console.error("Error resolving club UUID in supabase.js:", err);
    return null;
  }
}