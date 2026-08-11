param(
    [string]$Tag = "",
    [int]$WakeTimeoutSeconds = 240,
    [int]$PollSeconds = 10,
    [switch]$NoCache,
    [switch]$SkipUpdate
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\EverJobs.Common.ps1"

if ([string]::IsNullOrWhiteSpace($Tag)) {
    $Tag = Get-EverJobsTag
}

$startTime = Get-Date

$apiRemoteImage =
    "$EverJobsAcrServer/$EverJobsApiImage`:$Tag"

$mcpRemoteImage =
    "$EverJobsAcrServer/$EverJobsMcpImage`:$Tag"

Write-EverJobsHeader "EverJobs Full Azure Deployment"

Write-Host "Tag: $Tag"
Write-Host ""

# ============================================================
# Docker
# ============================================================

Write-Host "Checking Docker..."

Assert-EverJobsDocker

Write-Host "Docker is ready."

# ============================================================
# Repository
# ============================================================

if (-not $SkipUpdate) {

    Write-EverJobsHeader "1. Update Repository"

    & "$PSScriptRoot\Update-EverJobs.ps1"

    if ($LASTEXITCODE -ne 0) {
        throw "Repository update failed."
    }
}

# ============================================================
# Build + push API
# ============================================================

Write-EverJobsHeader "2. Build and Push API"

$apiBuildParams = @{
    Tag = $Tag
}

if ($NoCache) {
    $apiBuildParams.NoCache = $true
}

& "$PSScriptRoot\Build-Push-EverJobsApi.ps1" `
    @apiBuildParams

if ($LASTEXITCODE -ne 0) {
    throw "API build/push failed."
}

# ============================================================
# Build + push MCP
# ============================================================

Write-EverJobsHeader "3. Build and Push MCP"

$mcpBuildParams = @{
    Tag = $Tag
}

if ($NoCache) {
    $mcpBuildParams.NoCache = $true
}

& "$PSScriptRoot\Build-Push-EverJobsMcp.ps1" `
    @mcpBuildParams

if ($LASTEXITCODE -ne 0) {
    throw "MCP build/push failed."
}

# ============================================================
# Azure
# ============================================================

Write-EverJobsHeader "4. Deploy Container Apps"

Connect-EverJobsAzure

Write-Host ""
Write-Host "Deploying API..."
Write-Host ""

az containerapp update `
    --name $EverJobsApiApp `
    --resource-group $EverJobsResourceGroup `
    --image $apiRemoteImage

Assert-EverJobsLastCommand `
    "API Container App deployment failed."
	
Assert-EverJobsTelemetryMount

Write-Host ""
Write-Host "Deploying MCP..."
Write-Host ""

az containerapp update `
    --name $EverJobsMcpApp `
    --resource-group $EverJobsResourceGroup `
    --image $mcpRemoteImage

Assert-EverJobsLastCommand `
    "MCP Container App deployment failed."


# ============================================================
# Wake
# ============================================================

Write-EverJobsHeader "5. Wake and Verify"

& "$PSScriptRoot\Wake-EverJobs.ps1" `
    -TimeoutSeconds $WakeTimeoutSeconds `
    -PollSeconds $PollSeconds

if ($LASTEXITCODE -ne 0) {
    throw "EverJobs wake verification failed."
}

# ============================================================
# Complete
# ============================================================

$totalElapsed = [int](
    (Get-Date) - $startTime
).TotalSeconds

Write-EverJobsHeader "EverJobs Deployment Complete"

Write-Host "Commit:"

Set-EverJobsRepoLocation

git log -1 --oneline

Write-Host ""
Write-Host "Images:"
Write-Host "  API : $apiRemoteImage"
Write-Host "  MCP : $mcpRemoteImage"

Write-Host ""
Write-Host "Verification:"
Write-Host "  MCP      : READY"
Write-Host "  API      : REACHED THROUGH MCP"
Write-Host "  LinkedIn : RESULTS RETURNED"

Write-Host ""
Write-Host "Total deployment time: $totalElapsed seconds"
Write-Host ""