import "reflect-metadata";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { DataSource } from "typeorm";
import { User } from "./db/entities/User.entity.ts";
import { Organisation } from "./db/entities/Organisation.entity.ts";
import { TahfizCenter } from "./db/entities/TahfizCenter.entity.ts";

// Debugging logs (now they will show the actual values)
console.log("Checking Database URL:", process.env.DATABASE_URL ? "FOUND" : "MISSING");
console.log("Checking Database Type:", process.env.DATABASE_TYPE);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL environment variable is not set");

export const AppDataSource = new DataSource({
  type: (process.env.DATABASE_TYPE as any) || "postgres",
  url: databaseUrl,
  synchronize: process.env.DATABASE_SYNC === "true",
  logging: false,
  entities: [User, Organisation, TahfizCenter],
  migrations: ["src/db/migrations/*.ts"],
  subscribers: [],
});