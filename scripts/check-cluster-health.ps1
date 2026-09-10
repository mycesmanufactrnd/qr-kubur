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

    # pm2 jlist embeds each process's full environment under pm2_env.env, which can contain
    # keys that differ only by case (e.g. NODE_VERSION and node_version). ConvertFrom-Json
    # builds a case-INSENSITIVE object, so that collision throws DuplicateKeysInJsonString
    # no matter how the JSON is shaped. JavaScriptSerializer's Dictionary<string,object> is
    # case-sensitive, so parse with that instead.
    Add-Type -AssemblyName System.Web.Extensions
    $serializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $serializer.MaxJsonLength = 100MB
    $processes = $serializer.DeserializeObject($raw)
    $online = @($processes | Where-Object { $_["name"] -eq $AppName -and $_["pm2_env"]["status"] -eq "online" })

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
