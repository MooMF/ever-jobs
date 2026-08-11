param(
    [string]$Tag = "",
    [switch]$NoCache,
    [switch]$SkipUpdate
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\EverJobs.Common.ps1"

if ([string]::IsNullOrWhiteSpace($Tag)) {
    $Tag = Get-EverJobsTag
}

Write-EverJobsHeader "EverJobs API Deployment"

Write-Host "Tag: $Tag"
Write-Host ""

if (-not $SkipUpdate) {

    Write-Host "Updating repository..."
    Write-Host ""

    & "$PSScriptRoot\Update-EverJobs.ps1"

    if ($LASTEXITCODE -ne 0) {
        throw "Repository update failed."
    }
}

Write-Host ""
Write-Host "Building and pushing API..."
Write-Host ""

$buildParams = @{
    Tag = $Tag
}

if ($NoCache) {
    $buildParams.NoCache = $true
}

& "$PSScriptRoot\Build-Push-EverJobsApi.ps1" @buildParams

if ($LASTEXITCODE -ne 0) {
    throw "API build/push failed."
}

$remoteImage = "$EverJobsAcrServer/$EverJobsApiImage`:$Tag"

Write-Host ""
Write-Host "Deploying API Container App..."
Write-Host ""

Connect-EverJobsAzure

az containerapp update `
    --name $EverJobsApiApp `
    --resource-group $EverJobsResourceGroup `
    --image $remoteImage

Assert-EverJobsLastCommand `
    "API Container App deployment failed."

Write-Host ""
Write-Host "API deployment complete."
Write-Host "Image:"
Write-Host "  $remoteImage"