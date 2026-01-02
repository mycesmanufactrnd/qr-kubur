import { DataSource } from "typeorm";
// Corrected paths: Remove the extra "src"
import { User } from "./db/entities/User.entity.ts";
import { Organisation } from "./db/entities/Organisation.entity.ts";
import { TahfizCenter } from "./db/entities/TahfizCenter.entity.ts";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "db.pkuyaafdmcoqkpbjrwqs.supabase.co",
  port: 6543,
  username: "postgres",
  password: "!amin0105@stronk", // Use the raw password
  database: "postgres",
  synchronize: false,
  logging: true,
  entities: [User, Organisation, TahfizCenter],
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});