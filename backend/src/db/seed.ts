console.log("🌱 Starting database seed...");

const { runUserSeeder } = await import("./seeder/userSeeder.ts");
const { runBucketSeeder } = await import("./seeder/bucketSeeder.ts");

const { runSelangorGraveSeeder } = await import("./seeder/graves/selangorSeeder.ts");

console.log("\nSeeding users...");
await runUserSeeder();

console.log("\nSeeding graves...");
await runSelangorGraveSeeder();

console.log("\nSeeding buckets...");
await runBucketSeeder();

console.log("\n✅ Database seed operation completed");
process.exit(0);
