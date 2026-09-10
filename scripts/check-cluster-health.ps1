# Checks that all expected PM2 cluster workers are online inside the backend container.
# A plain HTTP hit only reaches one worker at random (nginx/PM2 load-balance which),
# so it can't detect a partially-crashed cluster the way this can.
#
# Reports success/failure to Healthchecks.io: pass -HealthcheckUrl explicitly, or set
# HEALTHCHECK_CLUSTER_URL in the env file ($EnvFile) and it's picked up automatically.
param(
    [string]$RepoRoot = (Resolve-Path "$PSScriptRoot\.."),
    [string]$EnvFile = ".env",
    [string]$ContainerName = "backend",
    [string]$AppName = "qubur-backend",
    [int]$ExpectedInstances = 5,
    [string]$HealthcheckUrl = ""
)

function Get-EnvValue($name) {
    $line = Get-Content "$RepoRoot\$EnvFile" | Where-Object { $_ -match "^$name=" }
    if (-not $line) { return $null }
    return ($line -split "=", 2)[1]
}

if (-not $HealthcheckUrl) {
    $HealthcheckUrl = Get-EnvValue "HEALTHCHECK_CLUSTER_URL"
}

function Ping-Healthcheck($suffix = "", $body = $null) {
    if ($HealthcheckUrl) {
        try {
            if ($body) {
                Invoke-WebRequest -Uri "$HealthcheckUrl$suffix" -Method Post -Body $body -UseBasicParsing -TimeoutSec 10 | Out-Null
            } else {
                Invoke-WebRequest -Uri "$HealthcheckUrl$suffix" -UseBasicParsing -TimeoutSec 10 | Out-Null
            }
        }
        catch { Write-Warning "Healthcheck ping failed: $_" }
    }
}

try {
    $raw = docker exec $ContainerName npx pm2 jlist
    if ($LASTEXITCODE -ne 0) { throw "Could not reach PM2 inside container '$ContainerName' (is it running?)" }

    $processes = $raw | ConvertFrom-Json
    $online = @($processes | Where-Object { $_.name -eq $AppName -and $_.pm2_env.status -eq "online" })

    if ($online.Count -lt $ExpectedInstances) {
        $msg = "Only $($online.Count)/$ExpectedInstances '$AppName' workers online"
        Write-Warning $msg
        Ping-Healthcheck "/fail" $msg
        exit 1
    }

    Write-Host "$($online.Count)/$ExpectedInstances '$AppName' workers online"
    Ping-Healthcheck
}
catch {
    Ping-Healthcheck "/fail" "$_"
    throw
}
