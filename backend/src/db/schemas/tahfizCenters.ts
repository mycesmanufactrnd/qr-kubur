import { pgTable, integer, varchar, timestamp, serial } from "drizzle-orm/pg-core";

export const tahfizCenters = pgTable("tahfiz_centers", {
    id: serial("id").primaryKey(), 

    name: varchar("name", { length: 255 }).notNull(),
    
    createdAt: timestamp("created_at").defaultNow(),
});
