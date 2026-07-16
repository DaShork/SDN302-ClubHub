/**
 * VNPay Payment Service
 * Handles payment creation and return processing with VNPay gateway.
 */
import { supabase } from './supabase';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/vnpay-payment`;

/**
 * Create a VNPay payment and get the payment URL.
 * @param {Object} params
 * @param {string} params.membershipId - Membership ID
 * @param {number} params.amount - Amount in VND (not multiplied by 100)
 * @param {string} params.clubName - Club name for description
 * @param {string} [params.description] - Payment description
 * @returns {Promise<{success: boolean, paymentUrl: string, txnRef: string}>}
 */
export async function createVNPayPayment({ membershipId, amount, clubName, description }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  if (!SUPABASE_URL) {
    throw new Error(
      'VITE_SUPABASE_URL is not configured. Set it in Vercel project settings.'
    );
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    body: JSON.stringify({
      membership_id: membershipId,
      amount,
      description: description || `Thanh toan phi thanh vien CLB ${clubName}`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('[vnpayService] Edge function responded with',
      response.status, 'at', EDGE_FUNCTION_URL, 'body:', errorBody);
    let parsed = null;
    try { parsed = JSON.parse(errorBody); } catch {}
    throw new Error(
      parsed?.error || parsed?.message ||
      `Edge function error ${response.status}`
    );
  }

  return response.json();
}

/**
 * Process VNPay return URL (called after user is redirected back from VNPay).
 * This parses the return parameters and shows appropriate message.
 * Actual payment status is confirmed via IPN (server-to-server).
 * @param {URLSearchParams} searchParams - URL search parameters from return URL
 * @returns {{ success: boolean, message: string, txnRef: string }}
 */
export function processVNPayReturn(searchParams) {
  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
  const vnp_TxnRef = searchParams.get('vnp_TxnRef');
  const vnp_Amount = searchParams.get('vnp_Amount');
  const vnp_BankCode = searchParams.get('vnp_BankCode');
  const vnp_PayDate = searchParams.get('vnp_PayDate');

  if (vnp_ResponseCode === '00') {
    return {
      success: true,
      message: 'Thanh toán thành công! Cảm ơn bạn đã đóng quỹ.',
      txnRef: vnp_TxnRef,
      amount: vnp_Amount ? (parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') : null,
      bankCode: vnp_BankCode,
      payDate: vnp_PayDate,
    };
  }

  const errorMessages = {
    '01': 'Giao dịch chưa hoàn tất do khách hàng chưa thanh toán.',
    '02': 'Giao dịch bị pending (đang xử lý).',
    '04': 'Giao dịch bị hủy bởi khách hàng.',
    '05': 'Giao dịch thất bại. Vui lòng thử lại.',
    '06': 'Giao dịch bị hủy do OTP không đúng.',
    '07': 'Giao dịch bị hủy do khách hàng không xác nhận thanh toán.',
    '09': 'Thẻ không tồn tại trong hệ thống VNPay.',
    '10': 'Xác thực thẻ thất bại (sai CVV, sai ngày hết hạn).',
    '11': 'Giao dịch đang chờ xác nhận (Out of balance).',
    '12': 'Thẻ hết hạn hoặc tài khoản bị khóa.',
    '13': 'Sai mật khẩu thanh toán (3 lần sai).',
    '23': 'Giao dịch bị hủy do trùng lặp giao dịch.',
    '24': 'Giao dịch không hợp lệ (sai checksum).',
    '99': 'Lỗi không xác định. Vui lòng liên hệ hỗ trợ.',
  };

  return {
    success: false,
    message: errorMessages[vnp_ResponseCode] || `Thanh toán thất bại (mã lỗi: ${vnp_ResponseCode}). Vui lòng thử lại.`,
    txnRef: vnp_TxnRef,
    errorCode: vnp_ResponseCode,
  };
}

/**
 * Get user's VNPay transaction history from Supabase.
 * @param {string} profileId - User profile ID
 * @returns {Promise<Array>}
 */
export async function getVNPayTransactions(profileId) {
  const { data, error } = await supabase
    .from('vnpay_transactions')
    .select(`
      *,
      memberships (
        clubs (id, name)
      )
    `)
    .eq('memberships.profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
