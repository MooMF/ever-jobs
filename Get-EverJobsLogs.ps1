[CmdletBinding()]
param(
    [int]$Days = 3,

    [datetime]$Since,

    [datetime]$Until,

    [switch]$Lightweight,

    [switch]$NoZip,

    [string]$OutputDirectory = "",

    [string[]]$Apps = @()
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\EverJobs.Common.ps1"

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = $EverJobsLogDirectory
}

if ($Apps.Count -eq 0) {
    $Apps = @(
        $EverJobsApiApp,
        $EverJobsMcpApp
    )
}

# ============================================================
# UTF-8
# ============================================================

[Console]::InputEncoding =
    [System.Text.UTF8Encoding]::new()

[Console]::OutputEncoding =
    [System.Text.UTF8Encoding]::new()

$OutputEncoding =
    [System.Text.UTF8Encoding]::new()

$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"

# ============================================================
# Azure session
# ============================================================

Write-EverJobsHeader "EverJobs Log Export"

Connect-EverJobsAzure

# ============================================================
# Resolve time window
# ============================================================

$nowUtc = (Get-Date).ToUniversalTime()

if ($PSBoundParameters.ContainsKey("Until")) {
    $untilUtc = $Until.ToUniversalTime()
}
else {
    $untilUtc = $nowUtc
}

if ($PSBoundParameters.ContainsKey("Since")) {
    $sinceUtc = $Since.ToUniversalTime()
}
else {
    $sinceUtc = $untilUtc.AddDays(-$Days)
}

if ($sinceUtc -ge $untilUtc) {
    throw "Since must be earlier than Until."
}

# ============================================================
# Export
# ============================================================

$params = @{
    FromUtc         = $sinceUtc
    ToUtc           = $untilUtc
    Apps            = $Apps
    OutputDirectory = $OutputDirectory
}

if ($Lightweight) {
    $params.Lightweight = $true
}

if ($NoZip) {
    $params.NoZip = $true
}

$result = Export-EverJobsLogs @params

# ============================================================
# Summary
# ============================================================

Write-Host ""
Write-Host "EverJobs logs exported."
Write-Host ""

Write-Host "Requested:"
Write-Host "  From UTC : $($result.FromUtc.ToString('o'))"
Write-Host "  To UTC   : $($result.ToUtc.ToString('o'))"

Write-Host ""

if ($result.ActualFirstUtc) {

    Write-Host "Returned:"
    Write-Host "  First UTC: $($result.ActualFirstUtc.ToString('o'))"
    Write-Host "  Last UTC : $($result.ActualLastUtc.ToString('o'))"
}
else {
    Write-Host "Returned:"
    Write-Host "  No log rows found."
}

Write-Host ""
Write-Host "Rows:"
Write-Host "  Total       : $($result.Count)"
Write-Host "  Diagnostic  : $($result.DiagnosticCount)"
Write-Host "  Error-like  : $($result.ErrorCount)"
Write-Host "  Warning     : $($result.WarningCount)"

Write-Host ""
Write-Host "Bundle:"
Write-Host "  Directory   : $($result.Directory)"
Write-Host "  Manifest    : $($result.Manifest)"
Write-Host "  Query       : $($result.Query)"
Write-Host "  Logs        : $($result.Logs)"
Write-Host "  Diagnostics : $($result.Diagnostics)"

if ($result.Json) {
    Write-Host "  Raw JSON    : $($result.Json)"
}

if ($result.Zip) {
    Write-Host "  ZIP         : $($result.Zip)"
}
else {
    Write-Host "  ZIP         : disabled"
}