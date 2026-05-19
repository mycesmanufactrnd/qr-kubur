import { runOrganisationTypeSeederProd } from "./seeder/production/organisationTypeSeeder.js";
import { runpaymentConfigSeederProd } from "./seeder/production/paymentConfigSeeder.js";
import { runUserSeederProd } from "./seeder/production/userSeeder.js";

console.log("🌱 Starting database seed...");

console.log("\nSeeding users...");
await runUserSeederProd();

console.log("\nSeeding payment config...");
await runpaymentConfigSeederProd();

console.log("\nSeeding organisation type...");
await runOrganisationTypeSeederProd();

console.log("\n✅ Database seed operation completed");
process.exit(0);
