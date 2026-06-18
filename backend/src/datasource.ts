import { DataSource } from "typeorm";
import * as entities from "./db/entities.js";

const prefix = process.env.NODE_ENV === "production" ? "LIVE" : "DEV";

const get = (key: string) => {
  const value = process.env[`${prefix}_${key}`];
  if (!value) throw new Error(`Missing env: ${prefix}_${key}`);
  return value;
};

const databaseUrl = `postgres://${get("POSTGRES_USER")}:${get("POSTGRES_PASSWORD")}@${get("POSTGRES_HOST")}:${get("POSTGRES_PORT")}/${get("POSTGRES_DB")}`;

console.log("\n🛢️ Checking Database URL:", databaseUrl ? "FOUND" : "MISSING");

console.log(databaseUrl);

if (!databaseUrl) throw new Error("DATABASE_URL environment variable is not set");

export const AppDataSource = new DataSource({
  type: "postgres",
  url: databaseUrl,
  synchronize: process.env.DATABASE_SYNC === "true",
  logging: false,
  entities: Object.values(entities),
  migrations: ["src/db/migrations/*.js"],
  subscribers: [],
});