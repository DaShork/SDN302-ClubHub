import { supabase } from "./supabase";
import { uploadFile, deleteFile } from "./storageService";

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

  // Upload a document file to Supabase storage and save metadata
  async uploadDocument({ clubId, title, file, fileType, uploaderId }) {
    // 1. Upload file to storage
    const { url, path, error: uploadError } = await uploadFile('documents', file, clubId);
    if (uploadError) throw new Error(uploadError);

    // 2. Save metadata to database
    const fileSize = file.size;
    const { data, error } = await supabase
      .from("documents")
      .insert([{
        club_id: clubId,
        title,
        file_url: url,
        file_size: fileSize,
        type: fileType,
        uploaded_by: uploaderId,
      }])
      .select()
      .single();

    if (error) {
      // Rollback: delete uploaded file if DB insert fails
      await deleteFile('documents', path).catch(() => {});
      throw error;
    }

    return data;
  },

  // Delete document record and its storage file
  async deleteDocument(docId) {
    // Get the document to find its file_url
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("file_url")
      .eq("id", docId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // Delete from storage if we have a path
    if (doc?.file_url) {
      // Extract path from URL: /storage/v1/object/public/documents/<path>
      const urlParts = doc.file_url.split('/storage/v1/object/public/documents/');
      if (urlParts[1]) {
        await deleteFile('documents', urlParts[1]).catch(() => {});
      }
    }

    // Delete record
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", docId);

    if (error) throw error;
    return true;
  }
};
