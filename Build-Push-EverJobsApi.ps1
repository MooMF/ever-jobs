param(
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

$RepoPath  = "C:\repos\EverJobs\ever-jobs"
$AcrName   = "ca799bf66e13acr"
$AcrServer = "$AcrName.azurecr.io"

Set-Location $RepoPath

Write-Host "=== Building EverJobs API : $Tag ==="

docker info | Out-Null

docker build `
    --no-cache `
    -f Dockerfile.api `
    -t "ever-jobs-api:$Tag" `
    .

Write-Host "=== Logging into Azure Container Registry ==="

az acr login --name $AcrName

Write-Host "=== Tagging image ==="

docker tag `
    "ever-jobs-api:$Tag" `
    "$AcrServer/ever-jobs-api:$Tag"

Write-Host "=== Pushing image ==="

docker push "$AcrServer/ever-jobs-api:$Tag"

Write-Host ""
Write-Host "Complete:"
Write-Host "$AcrServer/ever-jobs-api:$Tag"