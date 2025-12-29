import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL not set in .env");

export default defineConfig({
    out: "./drizzle",                       // where migration SQL files will be saved
    dialect: "postgresql",                  // must be 'postgresql' for Postgres
    schema: "./src/db/schema.ts",           // your Drizzle ORM table definitions
    dbCredentials: {
        url: databaseUrl                    // connection string from .env
    },
    introspect: {
        casing: "camel",                    // converts column names to camelCase in schema.ts if you ever pull
    },
    migrations: {
        prefix: "timestamp",                // prefix migration filenames with timestamp
        table: "__drizzle_migrations__",    // table to track applied migrations
        schema: "public",                   // schema where migrations table lives
    },
});

/*
==================== Drizzle Kit Commands ====================

1. npx drizzle-kit generate
   - Generates SQL migration files based on your Drizzle schema (`schema.ts`)
   - These SQL files are saved in the folder defined in `out`
   - Use this after you make changes to your schema

2. npx drizzle-kit migrate
   - Applies the previously generated SQL migration files to your database
   - Safe for production since it only runs migration files
   - Recommended workflow: generate → migrate

3. npx drizzle-kit push
   - Pushes your Drizzle schema directly to the database
   - Fast for local dev, but not recommended in production
   - Automatically creates/updates tables according to your schema

4. npx drizzle-kit pull
   - Introspects an existing database schema and generates a Drizzle `schema.ts`
   - Useful when adopting Drizzle on an existing database

5. npx drizzle-kit check
   - Checks if your Drizzle schema matches the database
   - Useful for CI/CD or validating schema consistency

6. npx drizzle-kit up
   - Combines `generate` + `migrate` in one step
   - Quickly updates the database to match your schema

7. npx drizzle-kit studio
   - Opens a visual GUI to explore your schema, migrations, and database
   - Helpful for debugging and development
===============================================================
*/