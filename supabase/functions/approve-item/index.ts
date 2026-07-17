import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Get profile + role
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role_id, roles(name)")
      .eq("id", user.id)
      .single();

    if (!profile?.roles?.name) return json({ error: "Role not found" }, 403);

    const roleName = profile.roles.name;

    const { item_type, item_id, action, comment } = await req.json();

    if (!item_type || !item_id || !action) {
      return json({ error: "Missing required fields" }, 400);
    }

    if (!["event", "workshop"].includes(item_type)) {
      return json({ error: "Invalid item_type" }, 400);
    }

    if (!["approve", "reject"].includes(action)) {
      return json({ error: "Invalid action" }, 400);
    }

    // Fetch current item
    const { data: item, error: itemError } = await supabase
      .from(item_type === "event" ? "events" : "workshops")
      .select("*, clubs(name)")
      .eq("id", item_id)
      .single();

    if (itemError || !item) {
      return json({ error: `${item_type} not found` }, 404);
    }

    // ── Mentor logic ─────────────────────────────────────────────────────────
    if (roleName === "Mentor") {
      if (item.approval_status !== "pending_mentor") {
        return json({ error: "This item is not pending mentor approval" }, 400);
      }
      if (action === "approve") {
        await supabase
          .from(item_type === "event" ? "events" : "workshops")
          .update({
            approval_status: "pending_manager",
            mentor_id: profile.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", item_id);

        await supabase.from("approval_logs").insert({
          item_type,
          item_id,
          action: "approve",
          performed_by: profile.id,
          approver_role: "mentor",
          comment,
        });

        await supabase.rpc("send_approval_notification", {
          p_item_type: item_type,
          p_item_id: item_id,
          p_action: "approve",
          p_approver_role: "mentor",
          p_performed_by: profile.id,
        });

        return json({ success: true, status: "pending_manager" });
      } else {
        await supabase
          .from(item_type === "event" ? "events" : "workshops")
          .update({
            approval_status: "rejected",
            rejected_by: profile.id,
            rejected_at: new Date().toISOString(),
            rejection_reason: comment || null,
          })
          .eq("id", item_id);

        await supabase.from("approval_logs").insert({
          item_type,
          item_id,
          action: "reject",
          performed_by: profile.id,
          approver_role: "mentor",
          comment,
        });

        await supabase.rpc("send_approval_notification", {
          p_item_type: item_type,
          p_item_id: item_id,
          p_action: "reject",
          p_approver_role: "mentor",
          p_performed_by: profile.id,
        });

        return json({ success: true, status: "rejected" });
      }
    }

    // ── Manager logic ────────────────────────────────────────────────────────
    if (roleName === "Manager") {
      if (item.approval_status !== "pending_manager") {
        return json({ error: "This item is not pending manager approval" }, 400);
      }
      if (action === "approve") {
        await supabase
          .from(item_type === "event" ? "events" : "workshops")
          .update({
            approval_status: "approved",
            manager_id: profile.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", item_id);

        await supabase.from("approval_logs").insert({
          item_type,
          item_id,
          action: "approve",
          performed_by: profile.id,
          approver_role: "manager",
          comment,
        });

        await supabase.rpc("send_approval_notification", {
          p_item_type: item_type,
          p_item_id: item_id,
          p_action: "approve",
          p_approver_role: "manager",
          p_performed_by: profile.id,
        });

        return json({ success: true, status: "approved" });
      } else {
        await supabase
          .from(item_type === "event" ? "events" : "workshops")
          .update({
            approval_status: "rejected",
            rejected_by: profile.id,
            rejected_at: new Date().toISOString(),
            rejection_reason: comment || null,
          })
          .eq("id", item_id);

        await supabase.from("approval_logs").insert({
          item_type,
          item_id,
          action: "reject",
          performed_by: profile.id,
          approver_role: "manager",
          comment,
        });

        await supabase.rpc("send_approval_notification", {
          p_item_type: item_type,
          p_item_id: item_id,
          p_action: "reject",
          p_approver_role: "manager",
          p_performed_by: profile.id,
        });

        return json({ success: true, status: "rejected" });
      }
    }

    return json({ error: "Only Mentor or Manager can approve items" }, 403);
  } catch (error) {
    console.error("approve-item error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
