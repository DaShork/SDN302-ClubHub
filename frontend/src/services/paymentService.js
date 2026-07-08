import { supabase } from './supabase';

/**
 * Payment Service
 * Sandbox payment: insert as pending, then simulate async completion.
 */

export async function listPaymentsByMembership(membershipId, { limit = 20 } = {}) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, memberships(profile_id, clubs(name))')
    .eq('membership_id', membershipId)
    .order('payment_date', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}

export async function listPaymentsByProfile(profileId, { limit = 20 } = {}) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, memberships(id, club_id, clubs(name))')
    .eq('memberships.profile_id', profileId)
    .order('payment_date', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}

export async function createSandboxPayment({ membershipId, amount, paymentMethod = 'sandbox', note = '' }) {
  const transactionCode = 'SBX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

  const { data, error } = await supabase
    .from('payments')
    .insert({
      membership_id: membershipId,
      amount,
      payment_method: paymentMethod,
      status: 'pending',
      transaction_code: transactionCode,
      note,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Simulate sandbox payment processing.
 * Returns a promise that resolves to the updated payment after ~1.5s.
 */
export function simulateSandboxPayment(paymentId, { delayMs = 1500 } = {}) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentId)
        .eq('status', 'pending')
        .select()
        .single();
      resolve({ data, error });
    }, delayMs);
  });
}

export async function getMembershipByProfile(profileId) {
  const { data, error } = await supabase
    .from('memberships')
    .select('*, clubs(name, id), club_terms(name)')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .limit(5);
  return { data: data || [], error };
}

export async function updatePaymentStatus(paymentId, status) {
  const { data, error } = await supabase
    .from('payments')
    .update({ status })
    .eq('id', paymentId)
    .select()
    .single();
  return { data, error };
}
