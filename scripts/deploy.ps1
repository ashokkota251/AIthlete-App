# AIthlete · Vercel deployment script
#
# Usage:
#   .\scripts\deploy.ps1                  → deploy with existing project linkage + env vars
#   .\scripts\deploy.ps1 -Setup           → first run: create project, push env vars, deploy
#   .\scripts\deploy.ps1 -Setup -Rotate   → also generate a fresh AUTH_SECRET in production
#
# Requires: node 18+, npm. Will auto-install the Vercel CLI globally on first run.
# Reads AUTH_STRAVA_ID, AUTH_STRAVA_SECRET, ANTHROPIC_API_KEY from .env.local.

[CmdletBinding()]
param(
    [switch]$Setup,
    [switch]$Rotate
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "→ $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "! $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "✗ $msg" -ForegroundColor Red }

# Move to repo root regardless of where the script was invoked from.
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

# ─── 1. Ensure Vercel CLI ──────────────────────────────────────────────────
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Step "Vercel CLI not found. Installing globally…"
    npm install -g vercel | Out-Null
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Err "Could not install vercel CLI. Run 'npm install -g vercel' manually."
        exit 1
    }
}
Write-Ok "Vercel CLI: $(vercel --version)"

# ─── 2. Ensure logged in ───────────────────────────────────────────────────
try {
    $who = (vercel whoami 2>$null).Trim()
} catch {
    $who = $null
}
if (-not $who) {
    Write-Step "Logging in to Vercel — a browser window will open."
    vercel login
    $who = (vercel whoami).Trim()
}
Write-Ok "Logged in as $who"

# ─── 3. Read secrets from .env.local ───────────────────────────────────────
$envFile = Join-Path $repoRoot ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Err ".env.local not found at $envFile"
    exit 1
}

$envMap = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$') {
        $envMap[$matches[1]] = $matches[2]
    }
}

$required = @("AUTH_STRAVA_ID", "AUTH_STRAVA_SECRET", "ANTHROPIC_API_KEY")
$missing  = $required | Where-Object { -not $envMap[$_] }
if ($missing.Count -gt 0) {
    Write-Err "Missing in .env.local: $($missing -join ', ')"
    exit 1
}

# Production AUTH_SECRET: never reuse the dev one.
if ($Setup -or $Rotate -or -not $envMap["AUTH_SECRET_PROD"]) {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $authSecret = [Convert]::ToBase64String($bytes)
    Write-Ok "Generated fresh production AUTH_SECRET (32 bytes, base64)"
} else {
    $authSecret = $envMap["AUTH_SECRET_PROD"]
}

# ─── 4. Link the Vercel project (creates it on first run) ─────────────────
$projectLinked = Test-Path (Join-Path $repoRoot ".vercel/project.json")
if (-not $projectLinked -or $Setup) {
    Write-Step "Linking / creating Vercel project…"
    # --yes accepts defaults for project name + scope.
    vercel link --yes
    if ($LASTEXITCODE -ne 0) {
        Write-Err "vercel link failed. Re-run with -Setup to retry."
        exit 1
    }
    Write-Ok "Project linked"
}

# ─── 5. Push env vars (Setup mode only) ────────────────────────────────────
function Set-VercelEnv($name, $value, $environments) {
    foreach ($envName in $environments) {
        Write-Host "    $name → $envName" -ForegroundColor DarkGray
        # Remove old value (silently ignore if it didn't exist), then add fresh.
        vercel env rm $name $envName --yes 2>$null | Out-Null
        # `vercel env add` reads value from stdin.
        $value | & vercel env add $name $envName 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "  Couldn't set $name for $envName (it may already exist)"
        }
    }
}

if ($Setup) {
    Write-Step "Pushing environment variables…"
    $envs = @("production", "preview", "development")
    Set-VercelEnv "AUTH_SECRET"        $authSecret                $envs
    Set-VercelEnv "AUTH_STRAVA_ID"     $envMap["AUTH_STRAVA_ID"]  $envs
    Set-VercelEnv "AUTH_STRAVA_SECRET" $envMap["AUTH_STRAVA_SECRET"] $envs
    Set-VercelEnv "ANTHROPIC_API_KEY"  $envMap["ANTHROPIC_API_KEY"] $envs
    Write-Ok "Env vars pushed"
}

# ─── 6. Deploy to production ───────────────────────────────────────────────
Write-Step "Deploying to production…"
$deployOutput = (vercel deploy --prod --yes 2>&1) | Out-String
Write-Host $deployOutput

$prodUrl = ($deployOutput |
    Select-String -Pattern 'https://[a-zA-Z0-9.\-]+\.vercel\.app' -AllMatches |
    ForEach-Object { $_.Matches.Value } |
    Where-Object { $_ -notlike '*vercel.com*' } |
    Select-Object -Last 1
)

Write-Host ""
if ($prodUrl) {
    Write-Ok "Deployment URL: $prodUrl"
    $domain = ($prodUrl -replace '^https?://', '').TrimEnd('/')
    Write-Host ""
    Write-Host "─────────────────────────────────────────────────────────────"
    Write-Host " FINAL STEP — set Strava callback domain to (exact value):" -ForegroundColor Yellow
    Write-Host "   $domain" -ForegroundColor Yellow
    Write-Host " At: https://www.strava.com/settings/api"
    Write-Host "─────────────────────────────────────────────────────────────"
} else {
    Write-Warn "Couldn't auto-detect production URL — check Vercel dashboard."
}
