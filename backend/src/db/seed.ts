console.log("🌱 Starting database seed...");

const { runUserSeeder } = await import("./seeder/userSeeder.ts");
const { runBucketSeeder } = await import("./seeder/bucketSeeder.ts");
const { runSelangorGraveSeeder } = await import("./seeder/selangorSeeder.ts");

import { runDeadPersonSeeder } from "./seeder/deadpersonSeeder.ts";
import { runOrganisationTypeSeeder } from "./seeder/organisationTypeSeeder.ts";
import { runOrganisationSeeder } from "./seeder/organisationSeeder.ts";
import { runTahfizSeeder } from "./seeder/tahfizSeeder.ts";
import { runDonationSeeder } from "./seeder/donationSeeder.ts";

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

console.log("\n✅ Database seed operation completed");
process.exit(0);
