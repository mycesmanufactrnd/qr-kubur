# Backup & Disaster Recovery

Backs up the Postgres database and `storage_data` volume to Google Drive, off the server, on a schedule.

## 1. Install rclone

Download from https://rclone.org/downloads/ (Windows amd64 zip), extract, and put `rclone.exe` on `PATH`.

## 2. Create your own OAuth client in Google Cloud Console (recommended)

rclone's shared `client_id` is being retired during 2026 — apps using it will start failing with `Continue using the shared client_id anyway?` warnings, then stop working outright. Set up your own client now rather than waiting for the backup job to silently break.

You don't need a new Cloud project — reuse the existing one behind this app's Firebase setup (`myces-qr-kubur`, visible at the top of the Google Cloud Console credentials page).

1. **Enable the Drive API**: Cloud Console → APIs & Services → Library → search "Google Drive API" → Enable (skip if already enabled)
2. **Configure the OAuth consent screen** (APIs & Services → OAuth consent screen), if not already done: choose External, fill in app name / your email
3. **Publish the app**: click **Publish App** to move it from "Testing" to "In production." `drive.file` is a *sensitive* (not *restricted*) scope, so this does **not** require Google's formal verification review — you'll just click through a one-time "unverified app" warning during login. Skipping this and leaving the app in "Testing" is the real trap: Google expires refresh tokens after 7 days for apps in Testing status, so a nightly scheduled backup would start silently failing a week later
4. **Create the credential**: Credentials → Create Credentials → OAuth client ID → Application type **Desktop app** → name it e.g. `rclone-qubur-backup`
5. Copy the generated **Client ID** and **Client Secret** — you'll paste these into `rclone config` in the next step

> Don't reuse the *Firebase-created* OAuth clients already in that project (the Android/Web ones auto-created by Firebase Auth) — their redirect URIs are locked to Firebase's auth flow, not rclone's local callback (`http://127.0.0.1:53682/`). Always create a dedicated "Desktop app" client for rclone.

If you skip this step for now, `rclone config` below still works using rclone's shared client (leave `client_id`/`client_secret` blank) — just expect to come back and do this before the 2026 retirement actually lands.

## 3. Configure the Google Drive remote (one-time, interactive)

```powershell
rclone config
```

- `n` for new remote, name it `gdrive`
- Storage type: `drive` (Google Drive)
- `client_id` / `client_secret`: paste the values from step 2 above (or leave both blank to use rclone's shared client — works today, but see the retirement note above)
- `scope`: `drive.file` — least privilege, rclone can only see/manage files and folders it creates itself, not your whole Drive. Consequence: let `rclone mkdir` create the backup folders (step below) rather than creating them by hand in the Drive web UI, or rclone won't have access to them
- `service_account_file`: blank — you're using interactive OAuth login (your own Google account), not a service account
- `Edit advanced config?`: **`n`** (recommended — this skips the whole table below and jumps straight to the next two prompts)
  - `Continue using the shared client_id anyway?` → `y` (you're accepting rclone's shared client since `client_id` was left blank)
  - `Use web browser to automatically authenticate rclone with remote?` → `y` if this machine has a browser you can log in with; `n` if it's a headless server — in that case run `rclone authorize "drive"` on your own machine instead and paste the resulting token back into this prompt
  - After the browser login completes: `Configure this as a Shared Drive (Team Drive)?` → **`n`** (default), unless you specifically have a Google Workspace **Shared Drive** you want backups stored in (a separate, org-owned drive — not your personal "My Drive"). Answering `y` makes it prompt you to pick one from a list; if you don't actually have one, that list will be empty/fail — `Ctrl+C` and rerun `rclone config`, then `e` to edit this remote (or `d` to delete and recreate it) answering `n` this time
- It'll print the finished remote config and ask `y/e/d` to confirm → `y`, then `q` to quit `rclone config`

**If you instead answer `y` to `Edit advanced config?`**, you'll be walked through every option below one at a time — press Enter (accept the default) for all of them; none of it matters for a plain DB-dump/storage-zip backup job:

| Prompt | Answer | Why |
|---|---|---|
| `token` | *(blank)* | Filled in automatically after you complete the browser login |
| `auth_url` / `token_url` | *(blank)* | Use Google's defaults |
| `client_credentials` | `false` (default) | That's a machine-to-machine OAuth flow, not what you're doing |
| `root_folder_id` | *(blank)* | Use your normal Drive root |
| `auth_owner_only`, `shared_with_me`, `trashed_only`, `starred_only` | `false` (default) | Operating on your own normal files, not filtered views |
| `use_trash` | `true` (default) | Deleted/overwritten backups go to Drive's trash instead of vanishing immediately — a safety net if the retention-prune step (`rclone delete`) ever deletes something it shouldn't |
| `copy_shortcut_content`, `skip_gdocs`, `show_all_gdocs`, `skip_checksum_gphotos`, `export_formats`, `import_formats`, `allow_import_name_change` | defaults | All Google Docs/Photos/Shortcuts concerns — you're uploading plain `.dump`/`.zip` files, none of this applies |
| `list_chunk`, `upload_cutoff`, `chunk_size`, `v2_download_min_size`, `pacer_min_sleep`, `pacer_burst`, `disable_http2`, `fast_list_bug_fix` | defaults | Performance/compatibility tuning that's fine at this scale |
| `impersonate` | *(blank)* | Only applies to service-account auth |
| `acknowledge_abuse` | `false` (default) | For downloading files Google's flagged as malware/spam — not relevant to your own backups |
| `keep_revision_forever` | `false` (default) | The script's own `-RetentionDays` pruning is what manages how long backups live; don't also pin every revision forever in Drive |
| `server_side_across_configs` | `false` (default) | Deprecated option for copying between two different Drive remotes — you only have one |
| `stop_on_upload_limit`, `stop_on_download_limit` | `false` (default) | Your daily upload (a DB dump + zipped storage) is nowhere near Google's undocumented 750GiB/day upload cap |
| `skip_shortcuts`, `skip_dangling_shortcuts` | `false` (default) | No shortcuts involved |
| `resource_key` | *(blank)* | Only needed for accessing someone else's link-shared folder |
| `metadata_owner` | `read` (default) | Reads owner metadata but never writes it — `write` would attempt to transfer file ownership and email the new owner, which you don't want here |
| `metadata_permissions` | `off` (default) | Backup files don't need Drive sharing-permission metadata read/written; `read` also works but costs a bit of listing speed for no benefit here |
| `metadata_labels` | `off` (default) | Same reasoning as permissions, plus reading labels costs an extra API call per listing — skip it |
| `metadata_enforce_expansive_access` | `false` (default) | A Feb-2026 Workspace access-rules flag for testing ahead of its default flip; not relevant to a personal/small-org Drive backup |
| `encoding` | *(blank)* → `InvalidUtf8` default | Filename encoding edge cases — your backup filenames (`db_<timestamp>.dump`, `storage_<timestamp>.zip`) are plain ASCII, default is fine |
| `env_auth` | `false` / option 1 (default) | You're entering credentials via the interactive browser login this session, not pulling GCP IAM credentials from environment/instance metadata (that's for code running on GCP infrastructure) |
| `description` | optional, e.g. `Qubur backups` | Just a human-readable label for this remote in `rclone config show` — doesn't affect behavior |

Verify it works:

```powershell
rclone lsd gdrive:
```

Create the backup folders in Drive: `rclone mkdir gdrive:qubur-backups` (prod) and `rclone mkdir gdrive:qubur-backups-dev` (dev)

## 4. Run a backup manually

**Prod** (reads `.env`, uploads to `gdrive:qubur-backups`):

```powershell
cd C:\path\to\qr-kubur
.\scripts\backup-to-gdrive.ps1
```

**Dev / local testing** (reads `.env.dev`, uploads to `gdrive:qubur-backups-dev`, only keeps 3 days):

```powershell
cd C:\path\to\qr-kubur
.\scripts\backup-to-gdrive.dev.ps1
```

Use the dev script to try out the whole flow — rclone auth, `pg_dump` against your local `docker-compose.dev.yml` stack, upload, restore — without touching prod backups or its retention window. Same underlying script (`backup-to-gdrive.ps1` takes `-EnvFile`, `-DbContainer`, `-RcloneRemote`, `-RetentionDays` params); the `.dev.ps1` file just calls it with dev defaults.

Both will:

1. `pg_dump` the database from the `postgres_db` container (custom format, compressed)
2. Zip `storage_data`
3. Upload both to `<remote>/<timestamp>/`
4. Delete remote backups older than the retention window (14 days prod, 3 days dev)

> Note: `docker-compose.yml` and `docker-compose.dev.yml` both use `container_name: postgres_db`, so don't run prod and dev stacks on the same machine at the same time — whichever started last owns that container name.

## 5. Schedule it (Windows Task Scheduler)

Nobody manually runs the backup in prod — Task Scheduler (the Windows equivalent of cron) fires it automatically. Two things matter for it to actually run unattended on a server that isn't always logged in:

1. **"Run whether user is logged on or not"** — the default logon type only runs while that user has an active interactive session (e.g. RDP). A server that mostly sits unattended needs credentials stored so Task Scheduler can log the account in behind the scenes. Set this via `-User`/`-Password` below (run once, interactively — don't commit the password anywhere).
2. **Same account that ran `rclone config`** — `rclone.conf` (containing your Drive auth token) lives in that account's profile (`%APPDATA%\rclone\rclone.conf`). The scheduled task must run as that exact same Windows account, or rclone won't find it.

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\path\to\qr-kubur\scripts\backup-to-gdrive.ps1"'
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "QuburBackupToGDrive" -Action $action -Trigger $trigger -RunLevel Highest `
  -User "<the account you ran 'rclone config' as>" -Password "<its password>"
```

Providing `-User`/`-Password` is what sets the logon type to "Run whether user is logged on or not" — Task Scheduler stores the credential securely (Windows Credential Manager), you don't need to keep the password anywhere after this one-time setup.

### Alerting on backup failure (Healthchecks.io)

`backup-to-gdrive.ps1` reads `HEALTHCHECK_BACKUP_URL` from the env file (`.env` in prod, `.env.dev` for the dev script) automatically — no need to pass `-HealthcheckUrl` on the command line. It:

- Pings `<url>/start` when the run begins
- Pings `<url>` (plain) on success
- Pings `<url>/fail` if any step throws

On the Healthchecks.io check's settings, set **Period = 1 day** and **Grace time = 1 hour** (matching the 2am daily schedule) — this way you get alerted both if the script errors out *and* if the scheduled task silently never fires at all (e.g. Task Scheduler misconfigured, credentials expired), which just watching Task Scheduler history wouldn't catch. Configure email/SMS/Slack under the check's integrations.

> Heads up: since `backup-to-gdrive.dev.ps1` reads the same `HEALTHCHECK_BACKUP_URL` value out of `.env.dev`, a manual dev test run pings the same Healthchecks.io check as prod. That's harmless for a one-off manual test (it just resets the timer early), but don't wire the dev script into any schedule of its own — it'd mask a real prod failure by looking like the daily ping still came in. Pass `-HealthcheckUrl ""` on a dev run if you want to skip pinging it entirely.

That account also needs permission to run `docker exec` (e.g. membership in the `docker-users` group, or be an administrator) — same account used for normal Docker management on this server is the simplest choice.

Check it ran: Task Scheduler > Task Scheduler Library > `QuburBackupToGDrive` > History tab. Or `rclone lsd gdrive:qubur-backups` to see the latest folders show up. Also worth doing one manual **Run** from Task Scheduler's UI right after creating it, to confirm it actually works unattended before trusting the 2am trigger.

## 6. Restore procedure (test this at least once — the dev backup is exactly for this)

**Database:**

```powershell
# copy the .dump file into the container, then:
docker exec -i postgres_db pg_restore -U qrkuburmyces -d qr_kubur --clean --if-exists < db_<timestamp>.dump
```

(dev uses `-U postgres` per `.env.dev` instead of `qrkuburmyces`)

**Storage:**

```powershell
Expand-Archive storage_<timestamp>.zip -DestinationPath .\storage_data -Force
```

Since a restore overwrites live data, always rehearse it against the dev stack first: run `.\scripts\backup-to-gdrive.dev.ps1`, then restore that dump into your local `docker-compose.dev.yml` `postgres_db` container and confirm the app still works before you ever need to do this against prod.

## 7. Full server-loss recovery

Backups above cover data loss (bad migration, accidental delete, disk failure). To rebuild the whole server elsewhere:

1. Provision a new box with Docker installed
2. Restore this git repo (`docker-compose.yml`, `dockerfiles/`, `.env` — `.env` is not in git, keep a copy in a password manager / secrets vault)
3. Restore `qubur.conf` and the SSL cert files (also not in git — back these up separately, e.g. alongside `.env`)
4. `docker compose up -d db`, restore the latest DB dump and `storage_data` archive from Google Drive
5. `docker compose up -d backend frontend`

This is a manual, cold-start recovery (expect downtime measured in tens of minutes, not seconds). Real-time DB replication / live storage mirroring would remove that downtime but adds real operational complexity — not recommended until you actually need near-zero-downtime failover.
