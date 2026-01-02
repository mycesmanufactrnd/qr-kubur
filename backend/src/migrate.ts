import { AppDataSource } from "./datasource.ts";
import { User as SupabaseUser } from "./db/entities/User.entity.ts";
import { createClient } from '@base44/sdk'; // Ensure this is installed in backend

async function migrateData() {
  try {
    await AppDataSource.initialize();
    console.log("🚀 Connected to Supabase...");

    const base44 = createClient({
      // Ensure these match your app-params
      appId: "your_app_id",
      serverUrl: "your_server_url", 
      token: "your_token",
      functionsVersion: "v1"
    });

    console.log("📡 Fetching users from Base44...");
    
    // FIX: Use the Query entity to find all records in the 'User' table
    // In Base44, entities are usually queried by name string
    let oldUsers: any[] = [];

    try {
        // Some versions of the SDK use this for direct entity access
        const response = await base44.integrations.Core.FetchData({
            entity: "User"
        });
        oldUsers = response?.data || response || [];
    } catch (e) {
        console.log("🔄 FetchData failed, trying Auth list...");
        
        // Attempt 2: Auth list (often used for user migration)
        try {
            const authResponse = await base44.auth.list(); 
            oldUsers = authResponse?.data || authResponse || [];
        } catch (e2) {
            // Attempt 3: The "Raw" Query
            console.log("🔄 Auth list failed, trying raw query...");
            const rawResponse = await base44.integrations.Core.Query({
                sql: "SELECT * FROM User" 
            });
            oldUsers = rawResponse?.data || rawResponse || [];
        }
    }

if (!oldUsers || oldUsers.length === 0) {
    console.log("⚠️ All fetch attempts failed or returned no data.");
    return;
}

    console.log(`📦 Found ${oldUsers.length} users. Starting migration...`);
    const supabaseRepo = AppDataSource.getRepository(SupabaseUser);
    
    for (const oldUser of oldUsers) {
      const existing = await supabaseRepo.findOneBy({ email: oldUser.email });
      if (existing) {
        console.log(`⏩ Skipping: ${oldUser.email}`);
        continue;
      }

      const newUser = supabaseRepo.create({
        fullname: oldUser.fullname || oldUser.name || "Unknown",
        email: oldUser.email,
        password: oldUser.password, // Transfer existing hash
        role: oldUser.role || 'employee',
        phoneno: oldUser.phoneno || null,
        state: oldUser.state || []
      });
      
      await supabaseRepo.save(newUser);
      console.log(`✅ Migrated: ${oldUser.email}`);
    }

    console.log("🏁 Migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  }
}

migrateData();