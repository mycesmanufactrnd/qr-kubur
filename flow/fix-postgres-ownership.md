# Fix PostgreSQL Table Ownership Error

## When to use this

When the backend fails to start with:
```
must be owner of table <tablename>
ERROR: must be owner of table tahfizcenter
STATEMENT: ALTER TABLE "tahfizcenter" DROP COLUMN "name"
```

This happens when the `db_data` Docker volume was originally created using the `postgres` superuser,
but the app now connects as a different user (e.g. `qrkuburmyces`). PostgreSQL won't let a non-owner
alter a table even if they are a superuser on the app side.

---

## Steps

### 1. Enter the PostgreSQL container

```bash
docker exec -it postgres_db psql -U postgres -d qr_kubur
```

### 2. Transfer ownership of all tables to the app user

```sql
DO $$ DECLARE r RECORD; BEGIN FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'postgres' LOOP EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO qrkuburmyces'; END LOOP; END $$;
```

### 3. Transfer ownership of all sequences (auto-increment IDs)

```sql
DO $$ DECLARE r RECORD; BEGIN FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' LOOP EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequence_name) || ' OWNER TO qrkuburmyces'; END LOOP; END $$;
```

### 4. Exit psql

```sql
\q
```

### 5. Restart the backend

```bash
docker compose restart backend
```

---

## Why this happens

PostgreSQL Docker only runs its init scripts on a **brand-new empty volume**. If the volume already
has data from a time when `POSTGRES_USER` was `postgres` (or was not set), all existing tables and
sequences are owned by `postgres`. Changing `POSTGRES_USER=qrkuburmyces` in `.env` does not
retroactively change ownership of existing objects.