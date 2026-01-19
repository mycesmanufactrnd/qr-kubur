console.log("🌱 Starting database seed...");

const { runUserSeeder } = await import("./seeder/userSeeder.ts");
const { runBucketSeeder } = await import("./seeder/bucketSeeder.ts");

const { runSelangorGraveSeeder } = await import("./seeder/graves/selangorSeeder.ts");

import { runDeadPersonSeeder } from "./seeder/deadperson/deadpersonSeeder.ts";

import { runOrganisationTypeSeeder } from "./seeder/organisation/organisationTypeSeeder.ts";
import { runOrganisationSeeder } from "./seeder/organisation/organisationSeeder.ts";
import { runTahfizSeeder } from "./seeder/tahfiz/tahfizSeeder.ts";
import { runDonationSeeder } from "./seeder/donation/donationSeeder.ts";
import { runBillplzSeeder } from "./seeder/gateway/billplzSeeder.ts";

console.log("\nSeeding users...");
await runUserSeeder();

console.log("\nSeeding graves...");
await runSelangorGraveSeeder();

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

console.log("\n✅ Database seed operation completed");
process.exit(0);
