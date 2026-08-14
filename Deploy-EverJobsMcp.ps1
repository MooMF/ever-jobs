$path = ".\Deploy-EverJobsMcp.ps1"

$content = @'
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

Write-EverJobsHeader "EverJobs MCP Deployment"

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
Write-Host "Building and pushing MCP..."
Write-Host ""

$buildParams = @{
    Tag = $Tag
}

if ($NoCache) {
    $buildParams.NoCache = $true
}

& "$PSScriptRoot\Build-Push-EverJobsMcp.ps1" @buildParams

if ($LASTEXITCODE -ne 0) {
    throw "MCP build/push failed."
}

$remoteImage = "$EverJobsAcrServer/$EverJobsMcpImage`:$Tag"

Write-Host ""
Write-Host "Deploying MCP Container App..."
Write-Host ""

Connect-EverJobsAzure

az containerapp update `
    --name $EverJobsMcpApp `
    --resource-group $EverJobsResourceGroup `
    --image $remoteImage

Assert-EverJobsLastCommand `
    "MCP Container App deployment failed."

Write-Host ""
Write-Host "MCP deployment complete."
Write-Host "Image:"
Write-Host "  $remoteImage"
'@

$utf8 = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
    (Join-Path (Get-Location) "Deploy-EverJobsMcp.ps1"),
    $content + "`r`n",
    $utf8
)

Write-Host "Created: $path"