import { supabase } from './supabase';

/**
 * Chat History Service
 *
 * Handles AI chat history + knowledge base search.
 * The "AI" answers are produced by ranking the most relevant rows across
 * clubs, knowledge articles, meeting minutes, workshops, announcements, and
 * upcoming events. RLS still applies — users only see rows they are allowed
 * to view (public knowledge + clubs they belong to).
 */

const EMPTY_RESULT = Object.freeze({ answer: '', sources: [] });

/* ---------------- Chat history (per-user, RLS-protected) ---------------- */

export async function listChatHistory(profileId, { limit = 50 } = {}) {
  if (!profileId) return { data: [], error: null };
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}

export async function createChatEntry(profileId, { question, answer }) {
  if (!profileId || !question) return { data: null, error: null };
  const { data, error } = await supabase
    .from('chat_history')
    .insert({ profile_id: profileId, question, answer: answer || '' })
    .select()
    .single();
  return { data, error };
}

export async function clearChatHistory(profileId) {
  if (!profileId) return { error: null };
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('profile_id', profileId);
  return { error };
}

/* ---------------- Knowledge base ranking ---------------- */

/**
 * Score = (sum of unique word hits) + (recency boost up to +10).
 * Words shorter than 3 chars are ignored to avoid noise.
 */
function rankResults(items, query) {
  const q = (query || '').toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  const scored = items.map((item) => {
    const text = [
      item.title || '',
      item.name || '',
      item.content || '',
      item.description || '',
      item.location || '',
      item.material_url || '',
    ]
      .join(' ')
      .toLowerCase();

    let score = 0;
    for (const word of words) {
      if (text.includes(word)) score += 1;
    }

    const stamp = item.created_at || item.start_time || item.meeting_date;
    const daysAgo = stamp ? Math.floor((Date.now() - new Date(stamp).getTime()) / 86400000) : 365;
    score += Math.max(0, 10 - daysAgo / 30); // recency boost
    return { ...item, _score: score };
  });

  return scored.sort((a, b) => b._score - a._score);
}

function snippet(text, max = 120) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Build the textual answer from the top-ranked item. */
function composeAnswer(top, query) {
  if (!top) {
    return (
      `I couldn't find specific information about "${query}" in the knowledge base.\n\n` +
      `Try asking about:\n` +
      `• Specific clubs or club activities\n` +
      `• Events and workshops\n` +
      `• Knowledge articles or meeting minutes\n` +
      `• Club announcements and policies`
    );
  }

  const club = top.club_name ? ` _(${top.club_name})_` : '';
  const lines = [];

  switch (top._type) {
    case 'club':
      lines.push(`Found a club that matches your question${club}:`);
      lines.push('');
      lines.push(`**${top.name}**${club}`);
      if (top.description) lines.push(top.description.slice(0, 300));
      if (top.location) lines.push(`📍 ${top.location}`);
      break;
    case 'event':
      lines.push(`Here's an upcoming event${club}:`);
      lines.push('');
      lines.push(`**${top.title}**${club}`);
      if (top.start_time) lines.push(`🗓 ${new Date(top.start_time).toLocaleString()}`);
      if (top.location) lines.push(`📍 ${top.location}`);
      if (top.description) lines.push(top.description.slice(0, 250));
      break;
    case 'article':
      lines.push(`Based on the knowledge base, here is what I found${club}:`);
      lines.push('');
      lines.push(`**${top.title}**${club}`);
      lines.push(snippet(top.content, 400));
      break;
    case 'meeting':
      lines.push(`Found a relevant meeting record${club}:`);
      lines.push('');
      lines.push(`**${top.title}**${club}`);
      if (top.meeting_date) lines.push(`🗓 ${new Date(top.meeting_date).toLocaleDateString()}`);
      lines.push(snippet(top.content, 400));
      break;
    case 'workshop':
      lines.push(`Here's a related workshop${club}:`);
      lines.push('');
      lines.push(`**${top.title}**${club}`);
      lines.push(snippet(top.description, 400));
      if (top.material_url) lines.push(`📎 Material: ${top.material_url}`);
      break;
    case 'announcement':
      lines.push(`Found a relevant announcement${club}:`);
      lines.push('');
      lines.push(`**${top.title}**${club}`);
      lines.push(snippet(top.content, 400));
      break;
    default:
      lines.push(`Found something relevant: **${top.title || top.name || '(no title)'}**`);
  }

  return lines.join('\n');
}

/**
 * Search the knowledge base.
 * Always returns `{ answer, sources }` so callers don't have to special-case
 * empty responses.
 */
export async function searchKnowledge(query, { profileId } = {}) {
  if (!query || query.trim().length < 2) return EMPTY_RESULT;

  const term = query.trim();

  // Pull rows in parallel — RLS scopes each query to what the caller can see.
  const [articles, minutes, workshops, announcements, events, clubs] = await Promise.all([
    supabase
      .from('knowledge_articles')
      .select('id, club_id, title, content, category, attachment_url, created_at, clubs ( name )')
      .limit(20),
    supabase
      .from('meeting_minutes')
      .select('id, club_id, title, content, meeting_date, created_at, clubs ( name )')
      .limit(10),
    supabase
      .from('workshops')
      .select('id, club_id, title, description, material_url, created_at, clubs ( name )')
      .limit(10),
    supabase
      .from('announcements')
      .select('id, club_id, title, content, created_at, clubs ( name )')
      .eq('audience', 'public')
      .limit(10),
    supabase
      .from('events')
      .select('id, club_id, title, description, location, start_time, status, created_at, clubs ( name )')
      .in('status', ['upcoming', 'ongoing'])
      .limit(10),
    supabase
      .from('clubs')
      .select('id, name, description, location, recruitment_status, created_at')
      .eq('status', 'active')
      .limit(15),
  ]);

  // Flatten the `clubs` join column into `club_name` for ranking + display.
  const flatten = (rows, type) =>
    (rows || []).map((r) => ({
      ...r,
      _type: type,
      club_name: r.clubs?.name ?? null,
    }));

  const allResults = [
    ...flatten(articles.data, 'article'),
    ...flatten(minutes.data, 'meeting'),
    ...flatten(workshops.data, 'workshop'),
    ...flatten(announcements.data, 'announcement'),
    ...flatten(events.data, 'event'),
    ...flatten(clubs.data, 'club'),
  ];

  const ranked = rankResults(allResults, term).slice(0, 5);
  const top = ranked[0];

  return {
    answer: composeAnswer(top, term),
    sources: ranked.map((r) => ({
      id: r.id,
      type: r._type,
      title: r.title || r.name,
      snippet: snippet(r.content || r.description, 120),
      score: Math.round(r._score),
      clubName: r.club_name,
    })),
  };
}