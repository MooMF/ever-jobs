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

Write-EverJobsHeader "Build and Push EverJobs API"

Write-Host "Tag: $Tag"
Write-Host ""

Assert-EverJobsDocker

$localImage  = "$EverJobsApiImage`:$Tag"
$remoteImage = "$EverJobsAcrServer/$EverJobsApiImage`:$Tag"

Write-Host "Building API image..."
Write-Host ""

$buildArgs = @(
    "build",
    "-f", $EverJobsApiDockerfile,
    "-t", $localImage
)

if ($NoCache) {
    $buildArgs += "--no-cache"
}

$buildArgs += "."

docker @buildArgs

Assert-EverJobsLastCommand `
    "API Docker build failed."

Write-Host ""

Connect-EverJobsAcr

Write-Host ""
Write-Host "Tagging API image..."

docker tag `
    $localImage `
    $remoteImage

Assert-EverJobsLastCommand `
    "Unable to tag API image."

Write-Host ""
Write-Host "Pushing API image..."

docker push $remoteImage

Assert-EverJobsLastCommand `
    "Unable to push API image."

Write-Host ""
Write-Host "API image ready:"
Write-Host "  $remoteImage"