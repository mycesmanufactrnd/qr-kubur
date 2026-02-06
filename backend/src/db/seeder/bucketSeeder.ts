// Add this beforehand

// docker exec -it supabase_storage /bin/sh
// chown -R 1000:1000 /var/lib/storage
// chmod -R 700 /var/lib/storage

// docker exec -it supabase_db psql -U postgres
// \du

// -- Add region column
// ALTER TABLE storage.buckets ADD COLUMN region text;

// -- Add tenant_id column
// ALTER TABLE storage.buckets ADD COLUMN tenant_id text;

import { exec } from "node:child_process";

export const runBucketSeeder = async () => {
  console.log("🌱 Seeding storage buckets...");

  const sql = `
    INSERT INTO storage.buckets
    (id, name, tenant_id, region, allowed_mime_types, file_size_limit, public)
    VALUES
    
    ('bucket-grave', 'Grave Images', 'qr-kubur', 'local',
    '{"image/png","image/jpeg","image/jpg","image/gif","image/webp"}',
    107374182400, true),

    ('tahfiz-center', 'Tahfiz Center Images', 'qr-kubur', 'local',
    '{"image/png","image/jpeg","image/jpg","image/gif","image/webp"}',
    107374182400, true),

    ('bucket-tahfiz-config', 'Tahfiz Payment Config Images', 'qr-kubur', 'local',
    '{"image/png","image/jpeg","image/jpg","image/gif","image/webp"}',
    107374182400, true),

    ('bucket-organisation-config', 'Organisation Payment Config Images', 'qr-kubur', 'local',
    '{"image/png","image/jpeg","image/jpg","image/gif","image/webp"}',
    107374182400, true),

    ('bucket-tahfiz-tahlil', 'Tahfiz Tahlil Request Config', 'qr-kubur', 'local',
    '{"image/png","image/jpeg","image/jpg","image/gif","image/webp"}',
    107374182400, true)

    ('heritage-site', 'Heritage Site', 'qr-kubur', 'local',
    '{"image/png","image/jpeg","image/jpg","image/gif","image/webp"}',
    107374182400, true)

    ('activity-post', 'Activity Post', 'qr-kubur', 'local',
    '{"image/png","image/jpeg","image/jpg","image/gif","image/webp"}',
    107374182400, true)

    ('waqf-project', 'Waqf Project', 'qr-kubur', 'local',
    '{"image/png","image/jpeg","image/jpg","image/gif","image/webp"}',
    107374182400, true)

    ON CONFLICT (id) DO NOTHING;
  `;

exec(
  `psql "${process.env.DATABASE_URL}" -c "${sql.replace(/"/g, '\\"')}"`,
  (err, stdout, stderr) => {
    if (err) {
      console.error("Failed to seed buckets:", err, stderr);
    } else {
      console.log("Buckets seeded successfully!");
      console.log(stdout);
    }
  }
);

  console.log("✔ Buckets seeded");
};
