// =============================================================================
// payment-sepay-webhook
// Sepay.vn webhook receiver — Sepay sends a similar POST payload when a
// transaction hits the registered bank account.
//
// Payload example:
//   {
//     "id": 12345,
//     "gateway": "VCB",
//     "transactionDate": "2024-08-15 14:30:00",
//     "accountNumber": "1234567890",
//     "code": null,
//     "content": "CLB K9M2 chuyen phi",
//     "transferType": "in",
//     "transferAmount": 100000,
//     "accumulated": ...,
//     "subAccount": null,
//     "referenceCode": "...",
//     "description": "..."
//   }
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SepayPayload {
  id?: number;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  content?: string;
  description?: string;
  transferType?: "in" | "out";
  transferAmount?: number;
}

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

function extractTxnRef(text: string): string | null {
  const m = text.match(/CLB[A-Z0-9]{4}/i);
  return m ? m[0].toUpperCase() : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // Sepay uses Authorization: Bearer <api-key> (or apikey header).
    const authHeader = req.headers.get("Authorization") ?? "";
    const expectedKey = Deno.env.get("SEPAY_API_KEY") ?? "";
    if (expectedKey) {
      const incoming = authHeader.replace(/^Bearer\s+/i, "");
      if (incoming !== expectedKey) {
        return json({ error: "unauthorized" }, 401);
      }
    }

    const tx: SepayPayload = await req.json();
    if (tx.transferType !== "in") {
      return json({ ok: true, ignored: "outgoing transfer" });
    }
    const description = (tx.content ?? tx.description ?? "").trim();
    const amount = tx.transferAmount ?? 0;
    if (!description || amount <= 0) {
      return json({ ok: true, ignored: "missing fields" });
    }

    const txnRef = extractTxnRef(description);
    if (!txnRef) {
      return json({ ok: true, ignored: "no txn_ref in description" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: payment } = await supabase
      .from("payments")
      .select("id, amount, status")
      .eq("transfer_content", txnRef)
      .maybeSingle();
    if (!payment || payment.status !== "pending") {
      return json({ ok: true, ignored: "no pending payment" });
    }
    if (Math.abs(Number(payment.amount) - amount) > 1) {
      console.warn(`amount mismatch for ${txnRef}`, payment.amount, amount);
      return json({ ok: true, ignored: "amount mismatch" });
    }

    await supabase
      .from("payments")
      .update({
        status: "completed",
        payment_date: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        confirmed_by: null,
      })
      .eq("id", payment.id);

    return json({ ok: true, processed: 1, payment_id: payment.id });
  } catch (err) {
    console.error("sepay webhook error:", err);
    return json({ ok: false, error: String(err) }, 200);
  }
});