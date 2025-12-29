import { serial, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const organisations = pgTable("organisations", {
    id: serial("id").primaryKey(), 

    name: varchar("name", { length: 255 }).notNull(),

    state: varchar("state", { length: 50 }).array(),
    
    createdAt: timestamp("created_at").defaultNow(),
});
