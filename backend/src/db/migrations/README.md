0. Create Migrations (Empty)
npm run migration:create -- src/db/migrations/ManualChange

1. Generate Migrations
npm run migration:generate -- src/db/migrations/MigrationChanges

2. Running Migrations
npm run migration:run

3. Reverting Migrations
npm run migration:revert