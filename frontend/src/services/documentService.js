import { supabase } from "./supabase";

export const documentService = {
  // Fetch documents for a specific club
  async getClubDocuments(clubId, type = null) {
    let query = supabase
      .from("documents")
      .select(`
        *,
        profiles (
          id,
          full_name
        )
      `)
      .eq("club_id", clubId);

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query.order("uploaded_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Save document metadata (link file from storage bucket)
  async saveDocumentMetadata(docData) {
    const { data, error } = await supabase
      .from("documents")
      .insert([docData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete document record
  async deleteDocument(docId) {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", docId);

    if (error) throw error;
    return true;
  }
};
