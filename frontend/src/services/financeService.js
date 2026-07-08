import { supabase } from "./supabase";

export const financeService = {
  // Get all memberships with payments for the current user
  async getUserPayments(profileId) {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        payment_date,
        payment_method,
        status,
        note,
        memberships (
          id,
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
    return data;
  },

  // Get club fee info for a user's memberships
  async getUserClubFees(profileId) {
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
    return data;
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

  // Get all payments for a club (Club Leader)
  async getClubPayments(clubId) {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        payment_date,
        payment_method,
        status,
        note,
        memberships (
          id,
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
    return data;
  },
};
