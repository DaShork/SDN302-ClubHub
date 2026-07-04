import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://thdlyzafslwymzvnutfv.supabase.co";
const supabaseKey = "sb_publishable_BdtugGX_5fc684hcWTJxGg_GPYMOZRV";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding database with club and memberships...");
  try {
    // 1. Create or get F-Code club
    console.log("Creating club 'F-Code'...");
    const { data: clubData, error: clubError } = await supabase
      .from("clubs")
      .insert([
        {
          name: "FPTU Software Engineering Club (F-Code)",
          logo_url: "https://api.dicebear.com/7.x/identicon/svg?seed=f-code"
        }
      ])
      .select();

    if (clubError) {
      console.error("❌ Club creation failed:", clubError);
      return;
    }

    const club = clubData[0];
    console.log("✅ Club created successfully. ID:", club.id);

    // 2. Fetch all profiles
    console.log("Fetching existing profiles...");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name");

    if (profilesError || !profiles) {
      console.error("❌ Failed to fetch profiles:", profilesError);
      return;
    }

    console.log(`Found ${profiles.length} profiles. Linking them as members...`);

    // 3. Create memberships
    const membershipsToInsert = profiles.map((p, index) => ({
      club_id: club.id,
      profile_id: p.id,
      position: index === 0 ? "Leader" : index === 1 ? "Mentor" : "Member",
      status: "active",
      joined_at: new Date().toISOString().split("T")[0]
    }));

    const { data: memsData, error: memsError } = await supabase
      .from("memberships")
      .insert(membershipsToInsert)
      .select();

    if (memsError) {
      console.error("❌ Failed to create memberships:", memsError);
    } else {
      console.log(`✅ Created ${memsData.length} memberships successfully!`);
    }

  } catch (err) {
    console.error("Exception during seed:", err);
  }
}

seed();
