console.log("🌱 Starting database seed...");

await import("./seeder/userSeeder.ts");

console.log("✅ Database seeded successfully");

process.exit(0);
