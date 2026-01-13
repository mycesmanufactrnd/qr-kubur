console.log("🌱 Starting database seed...");

const { runUserSeeder } = await import("./seeder/userSeeder.ts");
const { runBucketSeeder } = await import("./seeder/bucketSeeder.ts");

console.log("Seeding users...");
await runUserSeeder();

console.log("Seeding buckets...");
await runBucketSeeder();

console.log("✅ Database seed operation completed");
process.exit(0);
