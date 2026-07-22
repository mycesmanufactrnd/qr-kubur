import { DataSource } from "typeorm";
import * as entities from "./db/entities.js";

const get = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const databaseUrl = `postgres://${encodeURIComponent(get("POSTGRES_USER"))}:${encodeURIComponent(get("POSTGRES_PASSWORD"))}@${get("POSTGRES_HOST")}:${get("POSTGRES_PORT")}/${get("POSTGRES_DB")}`;

console.log("\n🛢️ Checking Database URL:", databaseUrl ? "FOUND" : "MISSING");

export const AppDataSource = new DataSource({
  type: "postgres",
  url: databaseUrl,
  synchronize: process.env.DATABASE_SYNC === "true",
  logging: false,
  entities: Object.values(entities),
  migrations: ["src/db/migrations/*.js"],
  subscribers: [],
});