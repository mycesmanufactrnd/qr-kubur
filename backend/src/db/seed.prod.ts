import { runBucketSeeder } from "./seeder/bucketSeeder.ts";
import { runpaymentConfigSeederProd } from "./seeder/production/paymentConfigSeeder.ts";
import { runUserSeederProd } from "./seeder/production/userSeeder.ts";

console.log("🌱 Starting database seed...");

console.log("\nSeeding users...");
await runUserSeederProd();

console.log("\nSeeding buckets...");
await runBucketSeeder();

console.log("\nSeeding payment config...");
await runpaymentConfigSeederProd();

console.log("\n✅ Database seed operation completed");
process.exit(0);
