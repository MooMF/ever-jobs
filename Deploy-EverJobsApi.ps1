param(
    [string]$Tag = ""
)

$ErrorActionPreference = "Stop"

$RepoPath      = "C:\repos\EverJobs\ever-jobs"
$ResourceGroup = "ever-jobs-rg"
$ApiApp        = "ever-jobs-api"

$AcrName       = "ca799bf66e13acr"
$AcrServer     = "$AcrName.azurecr.io"

if ([string]::IsNullOrWhiteSpace($Tag)) {
    $Tag = Get-Date -Format "yyyyMMdd-HHmmss"
}

Set-Location $RepoPath

Write-Host ""
Write-Host "======================================"
Write-Host " EverJobs API Deployment"
Write-Host " Tag: $Tag"
Write-Host "======================================"
Write-Host ""

# --------------------------------------------------
# 1. Update source
# --------------------------------------------------

Write-Host "=== [1/7] Updating repository ==="

git fetch --prune
git pull --ff-only

# --------------------------------------------------
# 2. Check Docker
# --------------------------------------------------

Write-Host ""
Write-Host "=== [2/7] Checking Docker ==="

docker info | Out-Null

# --------------------------------------------------
# 3. Build
# --------------------------------------------------

Write-Host ""
Write-Host "=== [3/7] Building API image ==="

docker build `
    --no-cache `
    -f Dockerfile.api `
    -t "ever-jobs-api:$Tag" `
    .

# --------------------------------------------------
# 4. Check Azure login
# --------------------------------------------------

Write-Host ""
Write-Host "=== [4/7] Checking Azure login ==="

az account show *> $null

if ($LASTEXITCODE -ne 0) {
    az login

    if ($LASTEXITCODE -ne 0) {
        throw "Azure login failed."
    }
}

# --------------------------------------------------
# 5. ACR login
# --------------------------------------------------

Write-Host ""
Write-Host "=== [5/7] Logging into ACR ==="

az acr login --name $AcrName

# --------------------------------------------------
# 6. Tag and push
# --------------------------------------------------

Write-Host ""
Write-Host "=== [6/7] Tagging and pushing ==="

$RemoteImage = "$AcrServer/ever-jobs-api:$Tag"

docker tag `
    "ever-jobs-api:$Tag" `
    $RemoteImage

docker push $RemoteImage

# --------------------------------------------------
# 7. Deploy Container App
# --------------------------------------------------

Write-Host ""
Write-Host "=== [7/7] Updating Azure Container App ==="

az containerapp update `
    --name $ApiApp `
    --resource-group $ResourceGroup `
    --image $RemoteImage

Write-Host ""
Write-Host "======================================"
Write-Host " Deployment complete"
Write-Host " Image: $RemoteImage"
Write-Host "======================================"