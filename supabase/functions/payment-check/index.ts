// =============================================================================
// payment-check
// Member-facing: checks a pending manual_bank payment by querying the Casso
// transaction API. If a matching transfer is found, the payment is marked
// completed.
//
// Flow:
//   1. Verify caller owns this payment (membership_id → profile match)
//   2. Call Casso /v3/transactions with the txn_ref as keyword
//   3. If a matching row is found with the correct amount, update
//      payments SET status='completed'
//   4. Return { status: 'completed' | 'pending', payment }
//
// Auth:
//   - Casso uses Apikey auth: header "Authorization: Apikey <key>"
//   - The key is set via Supabase secret CASSO_API_KEY
//   - Caller must own the payment (verified via membership.profile_id)
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface CassoTxn {
  id?: string;
  tid?: string;
  description?: string;
  amount?: number;
  bookingDate?: string;
  transactionDate?: string;
  when?: number;
}

async function queryCassoTransactions(
  apiKey: string,
  keyword: string,
  expectedAmount: number,
): Promise<{ tid: string; amount: number; time: number } | null> {
  // Casso filters: from, to, keyword, pageSize, page
  const params = new URLSearchParams({
    keyword: keyword,
    pageSize: "50",
    sort: "DESC",
  });

  const res = await fetch(
    `https://api.casso.vn/v3/transactions?${params}`,
    {
      method: "GET",
      headers: {
        Authorization: `Apikey ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const body = await res.text();
  let data: { data?: { records?: CassoTxn[] }; records?: CassoTxn[]; message?: string } = {};
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(`Casso returned non-JSON: ${res.status} ${body.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(`Casso API ${res.status}: ${data.message ?? body.slice(0, 200)}`);
  }

  const records = data?.data?.records ?? data?.records ?? [];
  console.log(`[payment-check] Casso returned ${records.length} records for keyword "${keyword}"`);

  const upperKeyword = keyword.toUpperCase();
  for (const tx of records) {
    const desc = (tx.description ?? "").toUpperCase();
    if (!desc.includes(upperKeyword)) continue;

    // Casso uses positive amount for incoming transfers (credit)
    const amount = Number(tx.amount ?? 0);
    if (amount <= 0) continue;

    if (Math.abs(amount - expectedAmount) > 1) {
      console.warn(
        `[payment-check] Amount mismatch: expected=${expectedAmount}, got=${amount}, desc="${tx.description}"`,
      );
      continue;
    }

    // bookingDate is ISO format e.g. "2025-08-15 10:30:00"
    let time = Date.now();
    if (tx.bookingDate) {
      const parsed = Date.parse(tx.bookingDate.replace(" ", "T") + "+07:00");
      if (!Number.isNaN(parsed)) time = parsed;
    } else if (tx.when) {
      time = Number(tx.when);
    }

    return {
      tid: String(tx.tid ?? tx.id ?? ""),
      amount,
      time,
    };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Missing authorization" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: auth } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { payment_id } = await req.json();
    if (!payment_id) return json({ error: "payment_id required" }, 400);

    const { data: payment, error: lookupErr } = await supabase
      .from("payments")
      .select("id, status, amount, transfer_content, membership_id")
      .eq("id", payment_id)
      .maybeSingle();
    if (lookupErr) return json({ error: lookupErr.message }, 400);
    if (!payment) return json({ error: "Payment not found" }, 404);
    if (payment.status !== "pending") {
      return json({
        status: payment.status,
        payment,
        message: `Payment already ${payment.status}`,
      });
    }

    // Verify ownership
    const { data: membership, error: memErr } = await supabase
      .from("memberships")
      .select("id, profile_id")
      .eq("id", payment.membership_id)
      .maybeSingle();
    if (memErr) return json({ error: memErr.message }, 400);
    if (!membership || membership.profile_id !== user.id) {
      return json({ error: "Forbidden: you do not own this payment" }, 403);
    }

    const txnRef = payment.transfer_content;
    const expectedAmount = Number(payment.amount);

    if (!txnRef) {
      return json({
        status: "pending",
        message: "Payment has no transfer_content. Please contact the club.",
      });
    }

    // ── Casso check ──────────────────────────────────────────────────────
    const cassoApiKey = Deno.env.get("CASSO_API_KEY");
    if (!cassoApiKey) {
      return json({
        status: "pending",
        message:
          "Casso API key not configured. Please wait for automatic confirmation or contact the club.",
      });
    }

    let matchedTx: { tid: string; amount: number; time: number } | null = null;
    try {
      matchedTx = await queryCassoTransactions(cassoApiKey, txnRef, expectedAmount);
    } catch (cassoErr) {
      console.error("[payment-check] Casso API error:", cassoErr);
      return json({
        status: "pending",
        message: "Unable to verify with bank. Please wait a moment and try again.",
        debug: String(cassoErr),
      });
    }

    if (!matchedTx) {
      return json({
        status: "pending",
        message: `Chưa tìm thấy giao dịch khớp với mã ${txnRef} và số tiền ${expectedAmount.toLocaleString("vi-VN")} VND. Vui lòng đợi 10-30 giây rồi thử lại (ngân hàng cần thời gian đồng bộ), hoặc kiểm tra lại nội dung chuyển khoản và số tiền.`,
      });
    }

    // ── Found a matching transfer — mark completed ────────────────────────
    const { data: updated, error: updateErr } = await supabase
      .from("payments")
      .update({
        status: "completed",
        payment_date: new Date(matchedTx.time).toISOString(),
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.id,
      })
      .eq("id", payment_id)
      .eq("status", "pending")
      .select()
      .single();

    if (updateErr) {
      console.error("[payment-check] Update error:", updateErr);
      return json({
        status: "pending",
        message: "Verification succeeded but failed to save. Please contact the club.",
        debug: updateErr.message,
      });
    }

    if (!updated) {
      return json({
        status: "completed",
        payment,
        message: "Payment was already confirmed.",
      });
    }

    console.log(
      `[payment-check] Self-confirmed payment ${payment_id} via Casso txn ${matchedTx.tid}`,
    );
    return json({
      success: true,
      status: "completed",
      payment: updated,
    });
  } catch (err) {
    console.error("[payment-check] Unhandled error:", err);
    return json({ error: String(err) }, 500);
  }
});