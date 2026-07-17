// =============================================================================
// payment-casso-webhook
//
// Casso pushes transaction notifications to this endpoint when a new transfer
// hits our linked bank account. Two authentication options are supported:
//
//   OPTION A — HMAC signature (recommended, used by most Casso accounts):
//     Casso sends header  X-Casso-Signature: <base64(hmac_sha256(body, checksum_key))>
//     We recompute and compare to verify the request is genuinely from Casso.
//
//   OPTION B — Bearer token (legacy, set in Casso dashboard as "Secure Token"):
//     Casso sends header  Authorization: Bearer <WEBHOOK_TOKEN>
//     Falls back to this if checksum_key is not configured.
//
// Casso dashboard setup:
//   URL  : https://<project>.supabase.co/functions/v1/payment-casso-webhook
//   Method: POST
//
// Payload shape (v2 API):
//   {
//     "error": 0,
//     "data": [
//       {
//         "id":          12345,
//         "tid":         "...",
//         "des":         "CLB K9M2 xyz...",   // <-- transfer description
//         "amount":      100000,
//         "time":        1690000000000,       // Unix ms
//         "bank_sub_acc_id": "...",
//         "virtual_account_number": "..."
//       }
//     ]
//   }
//
// Match logic:
//   1. Extract txn_ref via regex /CLB[A-Z0-9]{4}/i from `des`
//   2. Lookup pending payment WHERE transfer_content = txn_ref
//   3. Compare amount (tolerance ±1 VND for bank rounding)
//   4. UPDATE payments SET status='completed'
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CassoTxn {
  id?: number;
  tid?: string;
  des?: string;
  amount?: number;
  time?: number;
}

interface CassoPayload {
  error: number;
  data?: CassoTxn[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-casso-signature, x-casso-transmission",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Verify HMAC-SHA256 signature from Casso.
// Casso sends: X-Casso-Signature: <base64(hmac_sha256(raw_body, checksum_key))>
async function verifyHmac(
  rawBody: string,
  signatureHeader: string | null,
  checksumKey: string,
): Promise<boolean> {
  if (!signatureHeader || !checksumKey) return false;
  try {
    const key = new Uint8Array(
      [...checksumKey].map((c) => c.charCodeAt(0)),
    );
    const encoder = new TextEncoder();
    const bodyBytes = encoder.encode(rawBody);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", key,
      { name: "HMAC", hash: "SHA-256" },
      false, ["sign"],
    );
    const sigBytes = await crypto.subtle.sign("HMAC", cryptoKey, bodyBytes);
    const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
    return expected === signatureHeader;
  } catch {
    return false;
  }
}

// Fallback: Bearer token check (legacy "Secure Token" from Casso dashboard)
function verifyBearer(
  authHeader: string | null,
  expectedToken: string,
): boolean {
  if (!authHeader || !expectedToken) return false;
  const incoming = authHeader.replace(/^Bearer\s+/i, "").trim();
  return incoming === expectedToken;
}

// Extract the CLBxxxx txn_ref from a possibly noisy bank description.
// Banks auto-prefix the description so we scan the whole string.
function extractTxnRef(description: string): string | null {
  const m = description.match(/CLB[A-Z0-9]{4}/i);
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
    const rawBody = await req.text();

    const checksumKey = Deno.env.get("CASSO_CHECKSUM_KEY") ?? "";
    const webhookToken = Deno.env.get("CASSO_WEBHOOK_TOKEN") ?? "";

    // --- Authentication --------------------------------------------------
    const sigHeader = req.headers.get("x-casso-signature")
      ?? req.headers.get("X-Casso-Signature")
      ?? null;
    const authHeader = req.headers.get("Authorization");

    let authed = false;

    // Try HMAC first (preferred method with checksum_key)
    if (checksumKey && sigHeader) {
      authed = await verifyHmac(rawBody, sigHeader, checksumKey);
    }

    // Fallback to Bearer token
    if (!authed && webhookToken) {
      authed = verifyBearer(authHeader, webhookToken);
    }

    // If neither method configured, log and accept (dev fallback)
    if (!checksumKey && !webhookToken) {
      console.warn("CASSO_CHECKSUM_KEY and CASSO_WEBHOOK_TOKEN not set — accepting webhook without auth");
      authed = true;
    }

    if (!authed) {
      console.warn("Casso webhook rejected: bad auth",
        { sig: sigHeader ? "present" : "absent", token: webhookToken ? "set" : "unset" });
      return json({ error: "unauthorized" }, 401);
    }

    // --- Parse payload --------------------------------------------------
    let payload: CassoPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return json({ ok: false, error: "invalid JSON" }, 200);
    }

    if (payload.error !== 0 || !Array.isArray(payload.data)) {
      return json({ ok: true, processed: 0, reason: "no data" });
    }

    // --- Process transactions ------------------------------------------
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let processed = 0;
    for (const tx of payload.data) {
      const description = (tx.des ?? "").trim();
      const amount = tx.amount ?? 0;
      if (!description || amount <= 0) continue;

      const txnRef = extractTxnRef(description);
      if (!txnRef) continue;

      // Lookup pending payment by txn_ref
      const { data: payment, error: lookupErr } = await supabase
        .from("payments")
        .select("id, amount, status")
        .eq("transfer_content", txnRef)
        .maybeSingle();
      if (lookupErr) {
        console.error("lookup error:", lookupErr);
        continue;
      }
      if (!payment) continue;
      if (payment.status !== "pending") continue;

      // Amount tolerance ±1 VND (bank rounding edge cases)
      if (Math.abs(Number(payment.amount) - amount) > 1) {
        console.warn(
          `Amount mismatch for ${txnRef}: payment=${payment.amount}, bank=${amount}`,
        );
        continue;
      }

      // Mark completed
      const { error: updateErr } = await supabase
        .from("payments")
        .update({
          status: "completed",
          payment_date: tx.time
            ? new Date(tx.time).toISOString()
            : new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          confirmed_by: null, // auto-confirmed by webhook
        })
        .eq("id", payment.id);
      if (updateErr) {
        console.error("update error:", updateErr);
        continue;
      }

      processed += 1;
      console.log(`[casso] Auto-confirmed payment ${payment.id} via txn ${txnRef}`);
    }

    return json({ ok: true, processed });
  } catch (err) {
    console.error("[casso] Unhandled error:", err);
    // Return 200 so Casso doesn't infinitely retry on unexpected errors.
    return json({ ok: false, error: String(err) }, 200);
  }
});
