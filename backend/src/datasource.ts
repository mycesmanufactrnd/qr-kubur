import { DataSource } from "typeorm";
import * as entities from "./db/entities.ts";

console.log("\n🛢️ Checking Database URL:", process.env.DATABASE_URL ? "FOUND" : "MISSING");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL environment variable is not set");

export const AppDataSource = new DataSource({
  type: "postgres",
  url: databaseUrl,
  synchronize: process.env.DATABASE_SYNC === "true",
  logging: false,
  entities: Object.values(entities),
  migrations: ["src/db/migrations/*.ts"],
  subscribers: [],
});