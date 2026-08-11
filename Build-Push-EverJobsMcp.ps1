param(
    [string]$Tag = "",
    [switch]$NoCache
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\EverJobs.Common.ps1"

if ([string]::IsNullOrWhiteSpace($Tag)) {
    $Tag = Get-EverJobsTag
}

Set-EverJobsRepoLocation

Write-EverJobsHeader "Build and Push EverJobs MCP"

Write-Host "Tag: $Tag"
Write-Host ""

Assert-EverJobsDocker

$localImage  = "$EverJobsMcpImage`:$Tag"
$remoteImage = "$EverJobsAcrServer/$EverJobsMcpImage`:$Tag"

Write-Host "Building MCP image..."
Write-Host ""

$buildArgs = @(
    "build",
    "-f", $EverJobsMcpDockerfile,
    "-t", $localImage
)

if ($NoCache) {
    $buildArgs += "--no-cache"
}

$buildArgs += "."

docker @buildArgs

Assert-EverJobsLastCommand `
    "MCP Docker build failed."

Write-Host ""

Connect-EverJobsAcr

Write-Host ""
Write-Host "Tagging MCP image..."

docker tag `
    $localImage `
    $remoteImage

Assert-EverJobsLastCommand `
    "Unable to tag MCP image."

Write-Host ""
Write-Host "Pushing MCP image..."

docker push $remoteImage

Assert-EverJobsLastCommand `
    "Unable to push MCP image."

Write-Host ""
Write-Host "MCP image ready:"
Write-Host "  $remoteImage"