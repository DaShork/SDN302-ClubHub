import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://thdlyzafslwymzvnutfv.supabase.co";
const supabaseKey = "sb_publishable_BdtugGX_5fc684hcWTJxGg_GPYMOZRV";
const supabase = createClient(supabaseUrl, supabaseKey);
const CLUB_ID = "efdeaa8b-b1e5-4e44-bffa-59bebc1efadd";

// These 2 profiles exist but have no membership
const orphanProfiles = [
  { id: "be3f7620-3fa0-4643-99c0-63b63bcfd845", full_name: "hieu" },
  { id: "4a51618c-0879-4bed-8f42-1fa5b9adb3e4", full_name: "Tran Hoi Lang Cat" }
];

async function testMembershipInsert() {
  for (const p of orphanProfiles) {
    console.log(`\n--- Testing insert for ${p.full_name} ---`);
    const { data, error } = await supabase
      .from("memberships")
      .insert([{
        club_id: CLUB_ID,
        profile_id: p.id,
        position: "Member",
        status: "active",
        joined_at: new Date().toISOString().split("T")[0]
      }])
      .select();

    if (error) {
      console.log("❌ Insert error:", error.message, "| Code:", error.code);
    } else {
      console.log("✅ Membership created:", data[0].id);
    }
  }
}

testMembershipInsert();
