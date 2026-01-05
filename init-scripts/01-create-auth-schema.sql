-- Create Schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

-- Create Roles required by Supabase services
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon nologin;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated nologin;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role nologin;
  END IF;
END $$;

-- Create Authenticator User (for PostgREST)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator WITH LOGIN PASSWORD 'postgres';
  END IF;
END $$;

-- Grant basic privileges
GRANT ALL PRIVILEGES ON DATABASE supabase TO supabase_admin;
GRANT USAGE ON SCHEMA public, auth, storage TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public, auth, storage TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public, auth, storage GRANT SELECT ON TABLES TO authenticator;


-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";