# PostgreSQL Notes

## Incident: `password authentication failed for user "postgres"` (2026-07-11)

### What happened

Logs showed a new FATAL error every ~3 seconds:

```
FATAL: password authentication failed for user "postgres"
DETAIL: Connection matched pg_hba.conf line 100: "host all all all scram-sha-256"
```

**Root cause:** Something running locally on the host (port 5432 is `127.0.0.1` only, so it cannot be an external attacker) is in a retry loop trying to connect via TCP/IP as user `postgres` with a wrong password.

The `postgres` role on this server has `Cannot login` set intentionally — it has never been allowed to log in. This means the service was always misconfigured; it just wasn't hitting a problem before (possibly it was newly deployed or restarted).

### How to find the culprit

Check which process on the host is opening connections to port 5432:

```powershell
# Windows: show what process is connecting to 5432
netstat -ano | findstr ":5432"
# then look up the PID in Task Manager or:
Get-Process -Id <PID>
```

Likely suspects:
- A monitoring agent (e.g. pgBadger, Datadog, Zabbix, pgBouncer)
- A scheduled backup script using default `postgres` credentials
- A GitHub Actions runner job configured with wrong DB user
- pgAdmin or another GUI tool with saved wrong credentials

### Fix options

**Option A — Fix the connecting service (preferred)**
Find the service and change its DB user to `qrkuburmyces` (the actual app user).

**Option B — Allow postgres to log in (if needed)**
Only do this if you truly need to log in as postgres:
```sql
-- connect as wog (superuser, Unix socket, no password needed):
docker exec postgres_db psql -U wog -d postgres -c "ALTER ROLE postgres LOGIN; ALTER ROLE postgres PASSWORD 'your-secure-password';"
```
Then update the connecting service to use that password.

**Option C — Block the retry spam in pg_hba.conf**
If you know the IP of the offender and want to reject it outright, add a `reject` rule above line 100 in `/var/lib/postgresql/data/pg_hba.conf`.

---

## Existing setup

- **App user:** `qrkuburmyces` (no superuser; owns all tables/sequences/types in `public`)
- **Superusers available (via Unix socket only):** `wog`, `priv_esc`
- **`postgres` role:** Superuser but `Cannot login` — use `wog` for admin tasks:
  ```powershell
  docker exec postgres_db psql -U wog -d qr_kubur -c "<SQL>"
  ```
- **Database:** `qr_kubur`
- **Port binding:** `127.0.0.1:5432` — not exposed externally

## Schema permission fix applied (2026-07-11)

`qrkuburmyces` was a regular user with no privileges on the `public` schema (PostgreSQL 15 changed the default). Fixed by running as `wog`:

```sql
ALTER SCHEMA public OWNER TO qrkuburmyces;
GRANT ALL ON SCHEMA public TO qrkuburmyces;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO qrkuburmyces;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO qrkuburmyces;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO qrkuburmyces;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO qrkuburmyces;
-- Also changed owner of all existing enums, tables, sequences to qrkuburmyces
```
