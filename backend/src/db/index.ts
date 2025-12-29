import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// ni yang baca connection between backend and database
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client);
