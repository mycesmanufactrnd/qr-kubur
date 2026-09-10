# Backs up the Postgres DB and storage_data volume, uploads both to Google Drive via rclone,
# and prunes remote backups older than $RetentionDays. Run from the repo root (where
# docker-compose.yml and .env live), or pass -RepoRoot explicitly.
#
# Reports success/failure to Healthchecks.io: pass -HealthcheckUrl explicitly, or set
# HEALTHCHECK_BACKUP_URL in the env file ($EnvFile) and it's picked up automatically.
param(
    [string]$RepoRoot = (Resolve-Path "$PSScriptRoot\.."),
    [string]$EnvFile = ".env",
    [string]$DbContainer = "postgres_db",
    [string]$RcloneRemote = "gdrive:qubur-backups",
    [int]$RetentionDays = 14,
    [string]$HealthcheckUrl = ""
)

$ErrorActionPreference = "Stop"
$date = Get-Date -Format "yyyy-MM-dd_HHmmss"
$tempDir = Join-Path $env:TEMP "qubur-backup-$date"

# rclone lives in "C:\Program Files\rclone" and is on the machine PATH, but a shell
# that was already open when it was installed won't see that until restarted. Fall
# back to the known install location so this script doesn't depend on session state.
if (-not (Get-Command rclone -ErrorAction SilentlyContinue)) {
    $rcloneDir = "C:\Program Files\rclone"
    if (Test-Path (Join-Path $rcloneDir "rclone.exe")) {
        $env:PATH = "$env:PATH;$rcloneDir"
    }
}

function Get-EnvValue($name) {
    $line = Get-Content "$RepoRoot\$EnvFile" | Where-Object { $_ -match "^$name=" }
    if (-not $line) { return $null }
    return ($line -split "=", 2)[1]
}

if (-not $HealthcheckUrl) {
    $HealthcheckUrl = Get-EnvValue "HEALTHCHECK_BACKUP_URL"
}

function Ping-Healthcheck($suffix = "") {
    if ($HealthcheckUrl) {
        try { Invoke-WebRequest -Uri "$HealthcheckUrl$suffix" -UseBasicParsing -TimeoutSec 10 | Out-Null }
        catch { Write-Warning "Healthcheck ping failed: $_" }
    }
}

try {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    Ping-Healthcheck "/start"

    $pgUser = Get-EnvValue "POSTGRES_USER"
    $pgDb = Get-EnvValue "POSTGRES_DB"

    Write-Host "Dumping database $pgDb (container: $DbContainer, env: $EnvFile)..."
    $dumpFile = Join-Path $tempDir "db_$date.dump"
    docker exec $DbContainer pg_dump -U $pgUser -Fc $pgDb > $dumpFile
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed" }

    Write-Host "Archiving storage_data..."
    $storageZip = Join-Path $tempDir "storage_$date.zip"
    Compress-Archive -Path "$RepoRoot\storage_data\*" -DestinationPath $storageZip

    Write-Host "Uploading to $RcloneRemote/$date ..."
    rclone copy $tempDir "$RcloneRemote/$date" --progress
    if ($LASTEXITCODE -ne 0) { throw "rclone upload failed" }

    Write-Host "Pruning backups older than $RetentionDays days..."
    rclone delete $RcloneRemote --min-age "${RetentionDays}d"
    rclone rmdirs $RcloneRemote --leave-root

    Write-Host "Backup complete: $date"
    Ping-Healthcheck
}
catch {
    Ping-Healthcheck "/fail"
    throw
}
finally {
    if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
}
