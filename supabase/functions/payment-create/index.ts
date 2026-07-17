// =============================================================================
// payment-create
// Creates a pending `manual_bank` payment row and returns the bank account
// info + txn_ref the user must include in their transfer description.
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

// 6-char alphanumeric (A-Z, 2-9) — easy to type, avoids ambiguous
// characters 0/O, 1/I/L. Padded with random suffix if collision.
function generateTxnRef(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "CLB";
  for (let i = 0; i < 4; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

// VietQR image API: https://img.vietqr.io — free, no key required for
// basic QR generation. Renders a QR code pre-filled with bank, account,
// amount, and addInfo (transfer content). The user scans → app auto-fills.
function buildVietQrUrl(
  bankCode: string,
  accountNumber: string,
  accountName: string,
  amount: number,
  content: string,
): string {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: content,
    accountName: accountName,
  });
  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?${params}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

    const { membership_id, amount, note } = await req.json();
    if (!membership_id || !amount || amount <= 0) {
      return json({ error: "Invalid params" }, 400);
    }

    // Verify membership belongs to caller (RLS would also enforce this,
    // but a clean 404 here is friendlier than a generic RLS violation).
    const { data: membership, error: memErr } = await supabase
      .from("memberships")
      .select("id, profile_id")
      .eq("id", membership_id)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (memErr) return json({ error: memErr.message }, 400);
    if (!membership) return json({ error: "Membership not found" }, 404);

    // Pick the single active bank account. Future: support per-club.
    const { data: account } = await supabase
      .from("payment_bank_accounts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!account) {
      return json({ error: "No active bank account configured" }, 500);
    }

    // Generate a unique txn_ref. Try up to 5 times in the (very unlikely)
    // case of collision.
    let txnRef = generateTxnRef();
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("transfer_content", txnRef)
        .maybeSingle();
      if (!existing) break;
      txnRef = generateTxnRef();
    }

    const { data: payment, error: insertErr } = await supabase
      .from("payments")
      .insert({
        membership_id,
        amount,
        payment_method: "manual_bank",
        status: "pending",
        transfer_content: txnRef,
        transaction_code: txnRef, // back-compat with existing UI
        note: note ?? null,
      })
      .select()
      .single();
    if (insertErr) return json({ error: insertErr.message }, 400);

    return json({
      success: true,
      payment,
      bank_account: {
        bank_code: account.bank_code,
        bank_name: account.bank_name,
        account_number: account.account_number,
        account_name: account.account_name,
      },
      txn_ref: txnRef,
      qr_url: buildVietQrUrl(
        account.bank_code,
        account.account_number,
        account.account_name,
        amount,
        txnRef,
      ),
    });
  } catch (err) {
    console.error("payment-create error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});