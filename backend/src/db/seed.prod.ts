import { runBucketSeeder } from "./seeder/production/bucketSeeder.ts";
import { runOrganisationTypeSeederProd } from "./seeder/production/organisationTypeSeeder.ts";
import { runpaymentConfigSeederProd } from "./seeder/production/paymentConfigSeeder.ts";
import { runUserSeederProd } from "./seeder/production/userSeeder.ts";

console.log("🌱 Starting database seed...");

console.log("\nSeeding users...");
await runUserSeederProd();

console.log("\nSeeding buckets...");
await runBucketSeeder();

console.log("\nSeeding payment config...");
await runpaymentConfigSeederProd();

console.log("\nSeeding organisation type...");
await runOrganisationTypeSeederProd();

console.log("\n✅ Database seed operation completed");
process.exit(0);
