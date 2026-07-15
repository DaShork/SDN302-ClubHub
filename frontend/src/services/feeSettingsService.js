import { supabase } from '@/services/supabase';

/* feeSettingsService — read/write the monthly fee amount a Club Leader
 * sets for their club. Members read through the same table to see how
 * much they owe each month.
 *
 * Schema: see supabase/migrations/017_club_fee_settings.sql.
 */
export const feeSettingsService = {
  async get(clubId) {
    if (!clubId) return null;
    const { data, error } = await supabase
      .from('club_fee_settings')
      .select('club_id, monthly_amount, currency, updated_at')
      .eq('club_id', clubId)
      .maybeSingle();
    if (error) return null;
    return data || null;
  },

  async getMany(clubIds = []) {
    if (!clubIds.length) return [];
    const { data, error } = await supabase
      .from('club_fee_settings')
      .select('club_id, monthly_amount, currency, updated_at')
      .in('club_id', clubIds);
    if (error) return [];
    return data || [];
  },

  async upsert({ clubId, monthlyAmount, currency = 'VND', actorId }) {
    const { data, error } = await supabase
      .from('club_fee_settings')
      .upsert(
        {
          club_id: clubId,
          monthly_amount: monthlyAmount,
          currency,
          updated_by: actorId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'club_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};