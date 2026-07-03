import { supabase } from './supabase';

/**
 * Chat History Service
 * Handles AI chat history + knowledge base search (mock AI = DB search).
 */

/** List chat history for the current user */
export async function listChatHistory(profileId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}

/** Save a chat turn */
export async function createChatEntry(profileId, { question, answer }) {
  const { data, error } = await supabase
    .from('chat_history')
    .insert({ profile_id: profileId, question, answer })
    .select()
    .single();
  return { data, error };
}

/** Clear own chat history */
export async function clearChatHistory(profileId) {
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('profile_id', profileId);
  return { error };
}

/** Rank results by simple relevance: substring match + recency boost */
function rankResults(items, query) {
  const q = query.toLowerCase();
  const scored = items.map(item => {
    const text = ((item.title || '') + ' ' + (item.content || item.description || '') + ' ' + (item.material_url || '')).toLowerCase();
    let score = 0;
    q.split(' ').filter(w => w.length > 2).forEach(word => {
      if (text.includes(word)) score += 1;
    });
    const daysAgo = item.created_at
      ? Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000)
      : 365;
    score += Math.max(0, 10 - daysAgo / 30); // recency boost
    return { ...item, _score: score };
  });
  return scored.sort((a, b) => b._score - a._score);
}

/** Mock AI: search knowledge across all relevant tables */
export async function searchKnowledge(query, { profileId } = {}) {
  if (!query || query.trim().length < 2) return [];

  const [articles, minutes, workshops, announcements] = await Promise.all([
    supabase.from('knowledge_articles').select('id, club_id, title, content, category, attachment_url, created_at').limit(20),
    supabase.from('meeting_minutes').select('id, club_id, title, content, meeting_date, created_at').limit(10),
    supabase.from('workshops').select('id, club_id, title, description, material_url, created_at').limit(10),
    supabase.from('announcements').select('id, club_id, title, content, created_at').eq('audience', 'public').limit(10),
  ]);

  const allResults = [
    ...(articles.data || []).map(r => ({ ...r, _type: 'article' })),
    ...(minutes.data || []).map(r => ({ ...r, _type: 'meeting' })),
    ...(workshops.data || []).map(r => ({ ...r, _type: 'workshop' })),
    ...(announcements.data || []).map(r => ({ ...r, _type: 'announcement' })),
  ];

  const ranked = rankResults(allResults, query).slice(0, 5);

  if (ranked.length === 0) return [];

  const top = ranked[0];
  let answer = '';

  if (top._type === 'article') {
    answer = `Based on the knowledge base, here is what I found:\n\n**${top.title}**\n\n${(top.content || '').substring(0, 400)}${(top.content || '').length > 400 ? '...' : ''}`;
  } else if (top._type === 'meeting') {
    answer = `Found a relevant meeting record:\n\n**${top.title}** (${top.meeting_date})\n\n${(top.content || '').substring(0, 400)}${(top.content || '').length > 400 ? '...' : ''}`;
  } else if (top._type === 'workshop') {
    answer = `Here's a related workshop:\n\n**${top.title}**\n\n${(top.description || '').substring(0, 400)}${(top.description || '').length > 400 ? '...' : ''}`;
  } else {
    answer = `Found a relevant announcement:\n\n**${top.title}**\n\n${(top.content || '').substring(0, 400)}${(top.content || '').length > 400 ? '...' : ''}`;
  }

  return {
    answer,
    sources: ranked.map(r => ({
      id: r.id,
      type: r._type,
      title: r.title,
      snippet: ((r.content || r.description || '').substring(0, 120)),
      score: Math.round(r._score),
    })),
  };
}
