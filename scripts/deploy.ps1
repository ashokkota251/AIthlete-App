# AIthlete - Vercel deployment script
#
# Usage:
#   .\scripts\deploy.ps1                  -- deploy with existing project linkage
#   .\scripts\deploy.ps1 -Setup           -- first run: create project, push env vars, deploy
#   .\scripts\deploy.ps1 -Setup -Rotate   -- also generate a fresh AUTH_SECRET in production
#
# Requires: node 18+, npm. Will auto-install the Vercel CLI globally on first run.
# Reads AUTH_STRAVA_ID, AUTH_STRAVA_SECRET, ANTHROPIC_API_KEY from .env.local.

[CmdletBinding()]
param(
    [switch]$Setup,
    [switch]$Rotate
)

# Do NOT use "Stop" globally - Vercel CLI writes informational text to
# stderr which PowerShell would otherwise treat as a fatal error.
$ErrorActionPreference = "Continue"

function Write-Step($msg) { Write-Host "[..] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[!!] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[XX] $msg" -ForegroundColor Red }

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

# --- Helper: invoke vercel.cmd via cmd.exe so PowerShell doesn't choke on
# stderr chatter, and so we can use cmd-style stdin redirection.
function Invoke-Vercel {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$ArgString,
        [string]$Stdin = $null
    )
    if ($Stdin) {
        $tmp = [System.IO.Path]::GetTempFileName()
        try {
            [System.IO.File]::WriteAllText($tmp, $Stdin, [System.Text.UTF8Encoding]::new($false))
            $output = cmd.exe /c "vercel $ArgString < `"$tmp`" 2>&1"
        } finally {
            Remove-Item $tmp -Force -ErrorAction SilentlyContinue
        }
    } else {
        $output = cmd.exe /c "vercel $ArgString 2>&1"
    }
    $exit = $LASTEXITCODE
    return [pscustomobject]@{
        ExitCode = $exit
        Output   = ($output | Out-String)
    }
}

# --- 1. Ensure Vercel CLI -------------------------------------------------
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Step "Vercel CLI not found. Installing globally..."
    npm install -g vercel 2>&1 | Out-Null
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Err "Could not install vercel CLI. Run 'npm install -g vercel' manually."
        exit 1
    }
}
$ver = Invoke-Vercel -ArgString "--version"
Write-Ok ("Vercel CLI: " + $ver.Output.Trim())

# --- 2. Ensure logged in --------------------------------------------------
$who = Invoke-Vercel -ArgString "whoami"
$whoStr = $who.Output.Trim()
# whoami may print the "Vercel CLI X.Y.Z (Node...)" header - keep only the last non-empty line.
$whoLines = $whoStr -split "`r?`n" | Where-Object { $_ -and ($_ -notmatch '^Vercel CLI') }
$whoStr = if ($whoLines) { ($whoLines | Select-Object -Last 1).Trim() } else { "" }

if ($who.ExitCode -ne 0 -or -not $whoStr) {
    Write-Step "Logging in to Vercel - a browser window will open."
    & vercel login
    $who = Invoke-Vercel -ArgString "whoami"
    $whoLines = ($who.Output -split "`r?`n") | Where-Object { $_ -and ($_ -notmatch '^Vercel CLI') }
    $whoStr = if ($whoLines) { ($whoLines | Select-Object -Last 1).Trim() } else { "(unknown)" }
}
Write-Ok ("Logged in as " + $whoStr)

# --- 3. Read secrets from .env.local --------------------------------------
$envFile = Join-Path $repoRoot ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Err ".env.local not found at $envFile"
    exit 1
}

$envMap = @{}
foreach ($line in (Get-Content $envFile)) {
    if ($line -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$') {
        $key = $matches[1]
        $val = $matches[2].Trim()
        if ($val.StartsWith('"') -and $val.EndsWith('"')) {
            $val = $val.Substring(1, $val.Length - 2)
        }
        $envMap[$key] = $val
    }
}

$required = @("AUTH_STRAVA_ID", "AUTH_STRAVA_SECRET", "ANTHROPIC_API_KEY")
$missing = @()
foreach ($key in $required) {
    if (-not $envMap[$key]) { $missing += $key }
}
if ($missing.Count -gt 0) {
    Write-Err ("Missing in .env.local: " + ($missing -join ", "))
    exit 1
}

$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$authSecret = [Convert]::ToBase64String($bytes)
Write-Ok "Generated fresh production AUTH_SECRET (32 bytes, base64)"

# --- 4. Link the Vercel project (creates it on first run) -----------------
$projectLinked = Test-Path (Join-Path $repoRoot ".vercel/project.json")
if (-not $projectLinked) {
    Write-Step "Linking / creating Vercel project..."
    $linkResult = Invoke-Vercel -ArgString "link --yes"
    Write-Host $linkResult.Output
    if (-not (Test-Path (Join-Path $repoRoot ".vercel/project.json"))) {
        Write-Err "vercel link failed - .vercel/project.json not created."
        exit 1
    }
    Write-Ok "Project linked"
} else {
    Write-Ok "Project already linked (.vercel/project.json present)"
}

# --- 5. Push env vars (Setup mode only) -----------------------------------
function Set-VercelEnv {
    param([string]$Name, [string]$Value, [string[]]$Envs)
    foreach ($e in $Envs) {
        Write-Host ("    " + $Name + " -> " + $e) -ForegroundColor DarkGray
        # Remove first (ignore errors if it doesn't exist).
        [void](Invoke-Vercel -ArgString "env rm $Name $e --yes")
        # Add with value via stdin redirection.
        $addResult = Invoke-Vercel -ArgString "env add $Name $e" -Stdin $Value
        if ($addResult.ExitCode -ne 0) {
            Write-Warn ("  add failed for " + $Name + "/" + $e + " (exit " + $addResult.ExitCode + ")")
            $tail = ($addResult.Output -split "`r?`n" | Where-Object { $_ -match '\S' } | Select-Object -Last 3) -join " | "
            if ($tail) { Write-Host ("    " + $tail) -ForegroundColor DarkGray }
        }
    }
}

if ($Setup) {
    Write-Step "Pushing environment variables..."
    $envs = @("production", "preview", "development")
    Set-VercelEnv -Name "AUTH_SECRET"        -Value $authSecret                   -Envs $envs
    Set-VercelEnv -Name "AUTH_STRAVA_ID"     -Value $envMap["AUTH_STRAVA_ID"]     -Envs $envs
    Set-VercelEnv -Name "AUTH_STRAVA_SECRET" -Value $envMap["AUTH_STRAVA_SECRET"] -Envs $envs
    Set-VercelEnv -Name "ANTHROPIC_API_KEY"  -Value $envMap["ANTHROPIC_API_KEY"]  -Envs $envs
    Write-Ok "Env vars pushed"
}

# --- 6. Deploy to production ----------------------------------------------
Write-Step "Deploying to production..."
$deploy = Invoke-Vercel -ArgString "deploy --prod --yes"
Write-Host $deploy.Output

$prodUrl = $null
$urlMatches = [regex]::Matches($deploy.Output, 'https://[a-zA-Z0-9.\-]+\.vercel\.app')
foreach ($m in $urlMatches) {
    if ($m.Value -notlike '*vercel.com*') { $prodUrl = $m.Value }
}

Write-Host ""
if ($prodUrl) {
    Write-Ok ("Deployment URL: " + $prodUrl)
    $domain = ($prodUrl -replace '^https?://', '').TrimEnd('/')
    Write-Host ""
    Write-Host "-----------------------------------------------------------------"
    Write-Host " FINAL STEP - set Strava callback domain to (exact value):" -ForegroundColor Yellow
    Write-Host ("   " + $domain) -ForegroundColor Yellow
    Write-Host " At: https://www.strava.com/settings/api"
    Write-Host "-----------------------------------------------------------------"
} else {
    Write-Warn "Couldn't auto-detect production URL -- check Vercel dashboard."
}
