# Dev variant of backup-to-gdrive.ps1: reads .env.dev and uploads to a separate
# gdrive:qubur-backups-dev remote path, so local testing never touches prod backups.
param(
    [string]$RepoRoot = (Resolve-Path "$PSScriptRoot\.."),
    [string]$RcloneRemote = "gdrive:qubur-backups-dev",
    [int]$RetentionDays = 3,
    [string]$HealthcheckUrl = ""
)

& "$PSScriptRoot\backup-to-gdrive.ps1" `
    -RepoRoot $RepoRoot `
    -EnvFile ".env.dev" `
    -DbContainer "postgres_db" `
    -RcloneRemote $RcloneRemote `
    -RetentionDays $RetentionDays `
    -HealthcheckUrl $HealthcheckUrl
