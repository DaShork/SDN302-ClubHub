/**
 * Manual bank-transfer payment service.
 * Calls the `payment-create` edge function which returns:
 *   {
 *     success: true,
 *     payment: { id, status, amount, transfer_content, ... },
 *     bank_account: { bank_code, bank_name, account_number, account_name },
 *     txn_ref: 'CLBXXXX',
 *     qr_url: 'https://img.vietqr.io/image/...'
 *   }
 */
import { supabase } from './supabase';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const CREATE_URL = `${SUPABASE_URL}/functions/v1/payment-create`;

export async function createManualBankPayment({ membership_id, amount, note }) {
  if (!SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL is not configured.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(CREATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    body: JSON.stringify({ membership_id, amount, note }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[manualPayment] payment-create failed:', response.status, body);
    let parsed = null;
    try {
      parsed = JSON.parse(body);
    } catch {
      // Body is not JSON — fall back to raw status.
    }
    throw new Error(parsed?.error || `HTTP ${response.status}`);
  }

  return response.json();
}