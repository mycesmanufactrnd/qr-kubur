# Monitoring & Alerting

Two independent checks, both alerting through Healthchecks.io (see also `BACKUP_DR.md` for the backup-job check, set up the same way):

1. **App uptime** — is the site/API reachable at all (external, active probe)
2. **Cluster health** — are all 5 PM2 workers actually online inside the container (internal, passive dead-man's-switch)

A plain uptime ping only ever reaches *one* of the 5 PM2 workers (nginx/PM2 picks one per request), so it can't tell you 2 of 5 crashed while the rest keep responding — that's why both checks exist.

## 1. App uptime — `/health` endpoint + external monitor

`backend/src/server.ts` has a `/health` route that checks real DB connectivity (`SELECT 1`), not just "the process responds":

```
GET /health → 200 {"status":"ok","db":"connected"}
           → 503 {"status":"error","db":"unreachable"}  (or "not connected")
```

`qubur.conf` proxies `/health` to the backend (added alongside `/api/` and `/trpc/`) — without this, `/health` would fall through to the SPA's catch-all route and always return `index.html` with a 200, masking real outages.

**After deploying this change**, rebuild the backend image and reload nginx on the prod server:

```powershell
docker compose build backend
docker compose up -d backend
nginx -s reload
```

**Set up external monitoring** (free tier is enough — UptimeRobot, Better Uptime, etc.): point it at `https://qubur.mycesgroup.com/health`, checking every 5 minutes, alerting on anything other than HTTP 200. This is an *active* check (the monitor pings you), unlike Healthchecks.io which is *passive* (your job pings it) — that's why this piece isn't on Healthchecks.io.

## 2. Cluster health — `check-cluster-health.ps1` + Healthchecks.io

`scripts/check-cluster-health.ps1` runs `docker exec backend npx pm2 jlist` and counts how many `qubur-backend` processes report `status: online`. If fewer than 5, it pings a Healthchecks.io check's `/fail` endpoint (with the online count as the failure message); otherwise it pings success.

**Create a second Healthchecks.io check** for this (separate from the backup one — keep names distinguishable, e.g. **"Qubur — Cluster Health"**). Since this runs much more often than the daily backup, set:
- Period: 15 minutes
- Grace time: 5 minutes

**Schedule it** to run every 15 minutes via Task Scheduler (a repeating trigger, unlike the backup job's once-daily one):

`check-cluster-health.ps1` reads `HEALTHCHECK_CLUSTER_URL` from `.env` automatically (same pattern as the backup script) — no need to pass `-HealthcheckUrl` on the command line.

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\path\to\qr-kubur\scripts\check-cluster-health.ps1"'
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -TaskName "QuburClusterHealthCheck" -Action $action -Trigger $trigger -RunLevel Highest `
  -User "<same account as the backup task>" -Password "<its password>"
```

Same "Run whether user is logged on or not" reasoning as the backup task applies here — see `BACKUP_DR.md` step 5 for why `-User`/`-Password` matters.

Test it manually first:

```powershell
.\scripts\check-cluster-health.ps1
```

Should print `5/5 'qubur-backend' workers online`. Try `docker exec backend npx pm2 stop 0` to kill one worker and confirm the script reports `4/5` and would fail the healthcheck — then `npx pm2 start 0` (or restart the container) to bring it back before moving on.
