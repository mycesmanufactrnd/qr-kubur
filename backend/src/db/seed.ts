console.log("🌱 Starting database seed...");

const { runUserSeeder } = await import("./seeder/userSeeder.ts");

await runUserSeeder();

console.log("✅ Database seed operation completed");

process.exit(0);
