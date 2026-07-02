import { supabase } from "./supabase";

const SEARCH_TABLES = [
  { table: "clubs", fields: ["name", "description"], type: "club" },
  {
    table: "knowledge_articles",
    fields: ["title", "content"],
    type: "knowledge",
  },
  {
    table: "announcements",
    fields: ["title", "content"],
    type: "announcement",
  },
  {
    table: "meeting_minutes",
    fields: ["title", "content"],
    type: "meeting_minutes",
  },
  { table: "workshops", fields: ["title", "description"], type: "workshop" },
];

function buildSearchPattern(query) {
  return `%${query.trim()}%`;
}

async function searchTable(table, fields, type, pattern) {
  const orFilter = fields.map((f) => `${f}.ilike.${pattern}`).join(",");

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .or(orFilter)
    .limit(5);

  if (error) {
    console.warn(`Search failed for ${table}:`, error.message);
    return [];
  }

  return (data ?? []).map((item) => ({
    type,
    id: item.id,
    title: item.title ?? item.name,
    content: item.content ?? item.description ?? "",
    clubId: item.club_id ?? null,
    createdAt: item.created_at ?? null,
  }));
}

export async function searchKnowledge(query) {
  if (!query?.trim()) return [];

  const pattern = buildSearchPattern(query);
  const results = await Promise.all(
    SEARCH_TABLES.map(({ table, fields, type }) =>
      searchTable(table, fields, type, pattern)
    )
  );

  return results.flat().slice(0, 10);
}
