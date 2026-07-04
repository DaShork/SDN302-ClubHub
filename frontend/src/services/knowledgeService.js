import { supabase } from "./supabase";

export const knowledgeService = {
  // Fetch knowledge articles (general system articles if clubId is null, otherwise club specific)
  async getArticles(clubId = null, category = null) {
    let query = supabase
      .from("knowledge_articles")
      .select(`
        *,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `);

    if (clubId) {
      query = query.eq("club_id", clubId);
    } else {
      query = query.is("club_id", null);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Fetch article details by ID
  async getArticleById(articleId) {
    const { data, error } = await supabase
      .from("knowledge_articles")
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
      .eq("id", articleId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new knowledge article
  async createArticle(articleData) {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .insert([articleData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update a knowledge article
  async updateArticle(articleId, articleData) {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .update({ ...articleData, updated_at: new Date() })
      .eq("id", articleId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete a knowledge article
  async deleteArticle(articleId) {
    const { error } = await supabase
      .from("knowledge_articles")
      .delete()
      .eq("id", articleId);

    if (error) throw error;
    return true;
  }
};
