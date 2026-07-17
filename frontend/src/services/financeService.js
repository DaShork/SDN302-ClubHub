import { supabase } from "./supabase";

export const financeService = {
  // Get all memberships with payments for the current user.
  // SECURITY: filtered server-side by memberships.profile_id AND client-side
  // by short-circuiting when profileId is missing. RLS (migration 002)
  // additionally ensures users only see their own payments.
  async getUserPayments(profileId) {
    if (!profileId) return [];
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        currency,
        payment_date,
        payment_method,
        transaction_code,
        status,
        note,
        memberships!inner (
          id,
          profile_id,
          position,
          clubs (
            id,
            name,
            logo_url
          )
        )
      `)
      .eq("memberships.profile_id", profileId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get club fee info for a user's memberships.
  async getUserClubFees(profileId) {
    if (!profileId) return [];
    const { data, error } = await supabase
      .from("memberships")
      .select(`
        id,
        position,
        status,
        clubs (
          id,
          name,
          logo_url
        )
      `)
      .eq("profile_id", profileId)
      .eq("status", "active");

    if (error) throw error;
    return data || [];
  },

  // Record a new payment (Club Leader action)
  async recordPayment(membershipId, amount, method = "sandbox", note = "") {
    const { data, error } = await supabase
      .from("payments")
      .insert([{
        membership_id: membershipId,
        amount,
        payment_method: method,
        status: "completed",
        note,
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update payment status (Club Leader action)
  async updatePaymentStatus(paymentId, status) {
    const { data, error } = await supabase
      .from("payments")
      .update({ status })
      .eq("id", paymentId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get all payments for a club (Club Leader).
  // SECURITY: server-side filter by memberships.club_id and RLS via
  // is_club_leader(m.club_id). Always pass an explicit clubId — calling
  // without one returns all payments the caller can see, which is fine for
  // Admin/Manager but should never be used on member-facing routes.
  async getClubPayments(clubId) {
    if (!clubId) return [];
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        payment_date,
        payment_method,
        status,
        note,
        memberships!inner (
          id,
          club_id,
          position,
          profiles (
            id,
            full_name,
            student_code,
            email
          )
        )
      `)
      .eq("memberships.club_id", clubId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
