// =============================================================================
// payment-manual-confirm
// Called by a leader/admin from the finance dashboard to manually mark a
// pending `manual_bank` payment as completed. Use case: Casso/Sepay is
// unavailable or the user uploaded a bill image that needs verification.
//
// Body:
//   { payment_id: UUID, receipt_image_url?: string }
//
// Auth: caller must be authenticated AND be a leader of the club owning
// the membership, or be an admin/manager.
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

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

    const { payment_id, receipt_image_url } = await req.json();
    if (!payment_id) return json({ error: "payment_id required" }, 400);

    // Fetch the payment + its membership's club_id, then check permissions.
    const { data: payment, error: lookupErr } = await supabase
      .from("payments")
      .select(`
        id, status, amount,
        memberships!inner ( club_id )
      `)
      .eq("id", payment_id)
      .maybeSingle();
    if (lookupErr) return json({ error: lookupErr.message }, 400);
    if (!payment) return json({ error: "Payment not found" }, 404);
    if (payment.status !== "pending") {
      return json({ error: `Payment already ${payment.status}` }, 409);
    }

    const clubId = (payment.memberships as any)?.club_id;
    if (!clubId) return json({ error: "Missing club_id" }, 500);

    // Check admin role OR leadership of this club.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_name, role_id, roles(name)")
      .eq("id", user.id)
      .maybeSingle();
    const role = (profile as any)?.roles?.name ?? profile?.role_name;

    const isAdmin = role === "Administrator" || role === "Manager";
    if (!isAdmin) {
      const { data: leaderRow } = await supabase
        .from("memberships")
        .select("id, role_in_club")
        .eq("profile_id", user.id)
        .eq("club_id", clubId)
        .maybeSingle();
      const isLeader = leaderRow
        && ["leader", "president", "vice_president", "treasurer"]
          .includes(String(leaderRow.role_in_club).toLowerCase());
      if (!isLeader) return json({ error: "Forbidden" }, 403);
    }

    const { data: updated, error: updateErr } = await supabase
      .from("payments")
      .update({
        status: "completed",
        payment_date: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.id,
        receipt_image_url: receipt_image_url ?? null,
      })
      .eq("id", payment_id)
      .select()
      .single();
    if (updateErr) return json({ error: updateErr.message }, 400);

    return json({ success: true, payment: updated });
  } catch (err) {
    console.error("payment-manual-confirm error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});