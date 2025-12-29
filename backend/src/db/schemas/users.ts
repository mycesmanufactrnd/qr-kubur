import { pgTable, integer, varchar, text, timestamp, serial } from "drizzle-orm/pg-core";
import { organisations } from "./organisations.js";
import { tahfizCenters } from "./tahfizCenters.js";

export const users = pgTable("users", {
    id: serial("id").primaryKey(), 

    fullName: varchar("full_name", { length: 255 }),

    email: varchar("email", { length: 255 }).unique(),

    password: text("password"),

    role: varchar("role", { length: 20 }),

    organisationId: integer("organisation_id")
        .references(() => organisations.id),

    tahfizCenterId: integer("tahfiz_center_id")
        .references(() => tahfizCenters.id),

    state: varchar("state", { length: 50 }).array(),

    createdAt: timestamp("created_at").defaultNow(),
});
