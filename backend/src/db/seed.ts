import { runBucketSeeder } from "./seeder/bucketSeeder.ts";
import { runDeadPersonSeeder } from "./seeder/deadpersonSeeder.ts";
import { runDonationSeeder } from "./seeder/donationSeeder.ts";
import { runGraveSeeder } from "./seeder/graveSeeder.ts";
import { runOrganisationSeeder } from "./seeder/organisationSeeder.ts";
import { runOrganisationTypeSeeder } from "./seeder/organisationTypeSeeder.ts";
import { runTahfizSeeder } from "./seeder/tahfizSeeder.ts";
import { runUserSeeder } from "./seeder/userSeeder.ts";
import { runMosqueSeeder } from "./seeder/mosqueSeeder.ts";

console.log("🌱 Starting database seed...");

import { runBillplzSeeder } from "./seeder/gateway/billplzSeeder.ts";

console.log("\nSeeding users...");
await runUserSeeder();

console.log("\nSeeding graves...");
await runGraveSeeder();

console.log("\nSeeding buckets...");
await runBucketSeeder();

console.log("\nSeeding dead persons...");
await runDeadPersonSeeder();

console.log("\nSeeding Organisation Type...");
await runOrganisationTypeSeeder();

console.log("\nSeeding Organisations...");
await runOrganisationSeeder();

console.log("\nSeeding Tahfiz Centers...");
await runTahfizSeeder();

console.log("\nSeeding Donations...");
await runDonationSeeder();

console.log("\nSeeding Billplz Payment Platform...");
await runBillplzSeeder();

console.log("\nSeeding Mosques...");
await runMosqueSeeder();

console.log("\n✅ Database seed operation completed");
process.exit(0);