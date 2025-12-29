import { serial, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const organisations = pgTable("organisations", {
    id: serial("id").primaryKey(), 

    name: varchar("name", { length: 255 }).notNull(),
    
    createdAt: timestamp("created_at").defaultNow(),
});
