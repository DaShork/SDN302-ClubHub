import { supabase } from "./supabase";

export async function getChatHistory(profileId) {
  const { data, error } = await supabase
    .from("chat_history")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createChatEntry({ profileId, question, answer }) {
  const { data, error } = await supabase
    .from("chat_history")
    .insert({
      profile_id: profileId,
      question,
      answer,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChatEntry(id) {
  const { error } = await supabase.from("chat_history").delete().eq("id", id);
  if (error) throw error;
}

export async function clearChatHistory(profileId) {
  const { error } = await supabase
    .from("chat_history")
    .delete()
    .eq("profile_id", profileId);

  if (error) throw error;
}
