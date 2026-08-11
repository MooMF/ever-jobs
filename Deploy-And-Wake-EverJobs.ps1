param(
    [string]$Tag = "",
    [int]$WakeTimeoutSeconds = 240,
    [int]$PollSeconds = 10,
    [switch]$NoCache
)

$ErrorActionPreference = "Stop"

# ============================================================
# Configuration
# ============================================================

$RepoPath      = "C:\repos\EverJobs\ever-jobs"

$ResourceGroup = "ever-jobs-rg"

$AcrName       = "ca799bf66e13acr"
$AcrServer     = "$AcrName.azurecr.io"

$ApiApp        = "ever-jobs-api"
$McpApp        = "ever-jobs-mcp"

$ApiImage      = "ever-jobs-api"
$McpImage      = "ever-jobs-mcp"

$ApiDockerfile = "Dockerfile.api"
$McpDockerfile = "Dockerfile.mcp"

$ApiHealthUrl  = "https://ever-jobs-api.nicegrass-ebb7ee5d.uksouth.azurecontainerapps.io/health"
$McpHealthUrl  = "https://ever-jobs-mcp.nicegrass-ebb7ee5d.uksouth.azurecontainerapps.io/health"

# Generate a unique deployment tag unless supplied explicitly.
if ([string]::IsNullOrWhiteSpace($Tag)) {
    $Tag = Get-Date -Format "yyyyMMdd-HHmmss"
}

$ApiRemoteImage = "$AcrServer/$ApiImage`:$Tag"
$McpRemoteImage = "$AcrServer/$McpImage`:$Tag"

$StartTime = Get-Date
$TotalSteps = 9

# ============================================================
# Helpers
# ============================================================

function Write-Step {
    param(
        [int]$Number,
        [int]$Total,
        [string]$Message
    )

    Write-Host ""
    Write-Host "============================================================"
    Write-Host "[$Number/$Total] $Message"
    Write-Host "============================================================"
}

function Assert-LastCommand {
    param(
        [string]$Message
    )

    if ($LASTEXITCODE -ne 0) {
        throw $Message
    }
}

function Test-HealthEndpoint {
    param(
        [string]$Name,
        [string]$Url
    )

    try {
        $response = Invoke-WebRequest `
            -Uri $Url `
            -Method Get `
            -TimeoutSec 15

        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Write-Host "$Name : READY ($($response.StatusCode))"
            return $true
        }

        Write-Host "$Name : waiting ($($response.StatusCode))"
        return $false
    }
    catch {
        try {
            $status = [int]$_.Exception.Response.StatusCode
            Write-Host "$Name : waiting ($status)"
        }
        catch {
            Write-Host "$Name : waiting..."
        }

        return $false
    }
}

# ============================================================
# Start
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " EverJobs - Full Azure Deployment"
Write-Host ""
Write-Host " Tag : $Tag"
Write-Host "============================================================"

# ============================================================
# 0. Docker Desktop reminder
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host "[0/$TotalSteps] Docker Desktop"
Write-Host "============================================================"
Write-Host ""
Write-Host "Make sure Docker Desktop is running."
Write-Host ""
Write-Host "Start Docker Desktop now if it is not already running."
Write-Host ""

Read-Host "Press ENTER once Docker Desktop is running"

Write-Host ""
Write-Host "Checking Docker engine..."

docker info *> $null

if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop is not ready. Start Docker Desktop and run the script again."
}

Write-Host "Docker engine confirmed."

# ============================================================
# 1. Update repository
# ============================================================

Write-Step 1 $TotalSteps "Updating EverJobs repository"

Set-Location $RepoPath

Write-Host "Current branch:"
git branch --show-current
Assert-LastCommand "Unable to determine Git branch."

Write-Host ""
Write-Host "Local status:"
git status --short
Assert-LastCommand "Git status failed."

Write-Host ""
Write-Host "Fetching remote..."
git fetch --prune
Assert-LastCommand "Git fetch failed."

Write-Host ""
Write-Host "Pulling latest version..."
git pull --ff-only
Assert-LastCommand "Git pull failed. Check for local changes or divergent history."

Write-Host ""
Write-Host "Deploying commit:"
git log -1 --oneline
Assert-LastCommand "Unable to read Git commit."

# ============================================================
# 2. Confirm Docker
# ============================================================

Write-Step 2 $TotalSteps "Confirming Docker"

docker info *> $null
Assert-LastCommand "Docker is no longer available."

Write-Host "Docker engine is running."

# ============================================================
# 3. Build API
# ============================================================

Write-Step 3 $TotalSteps "Building EverJobs API"

$ApiBuildArgs = @(
    "build",
    "-f", $ApiDockerfile,
    "-t", "$ApiImage`:$Tag"
)

if ($NoCache) {
    $ApiBuildArgs += "--no-cache"
}

$ApiBuildArgs += "."

docker @ApiBuildArgs
Assert-LastCommand "API Docker build failed."

# ============================================================
# 4. Build MCP
# ============================================================

Write-Step 4 $TotalSteps "Building EverJobs MCP"

$McpBuildArgs = @(
    "build",
    "-f", $McpDockerfile,
    "-t", "$McpImage`:$Tag"
)

if ($NoCache) {
    $McpBuildArgs += "--no-cache"
}

$McpBuildArgs += "."

docker @McpBuildArgs
Assert-LastCommand "MCP Docker build failed."

# ============================================================
# 5. Azure login
# ============================================================

Write-Step 5 $TotalSteps "Checking Azure login"

az account show *> $null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Azure session not available."
    Write-Host "Starting Azure login..."
    Write-Host ""

    az login
    Assert-LastCommand "Azure login failed."
}

$Subscription = az account show --query name -o tsv
Assert-LastCommand "Unable to determine Azure subscription."

Write-Host "Azure subscription: $Subscription"

# ============================================================
# 6. ACR login
# ============================================================

Write-Step 6 $TotalSteps "Logging into Azure Container Registry"

az acr login --name $AcrName
Assert-LastCommand "ACR login failed."

# ============================================================
# 7. Tag and push
# ============================================================

Write-Step 7 $TotalSteps "Pushing API and MCP images"

Write-Host ""
Write-Host "Tagging API image..."

docker tag `
    "$ApiImage`:$Tag" `
    $ApiRemoteImage

Assert-LastCommand "Failed to tag API image."

Write-Host "Pushing API image..."

docker push $ApiRemoteImage
Assert-LastCommand "Failed to push API image."

Write-Host ""
Write-Host "Tagging MCP image..."

docker tag `
    "$McpImage`:$Tag" `
    $McpRemoteImage

Assert-LastCommand "Failed to tag MCP image."

Write-Host "Pushing MCP image..."

docker push $McpRemoteImage
Assert-LastCommand "Failed to push MCP image."

# ============================================================
# 8. Deploy Container Apps
# ============================================================

Write-Step 8 $TotalSteps "Updating Azure Container Apps"

Write-Host ""
Write-Host "Deploying API..."

az containerapp update `
    --name $ApiApp `
    --resource-group $ResourceGroup `
    --image $ApiRemoteImage

Assert-LastCommand "API Container App deployment failed."

Write-Host ""
Write-Host "Deploying MCP..."

az containerapp update `
    --name $McpApp `
    --resource-group $ResourceGroup `
    --image $McpRemoteImage

Assert-LastCommand "MCP Container App deployment failed."

# ============================================================
# 9. Wake API + MCP
# ============================================================

Write-Step 9 $TotalSteps "Waking API and MCP"

$WakeStart = Get-Date

$ApiReady = $false
$McpReady = $false

while (-not ($ApiReady -and $McpReady)) {

    if (-not $ApiReady) {
        $ApiReady = Test-HealthEndpoint `
            -Name "API" `
            -Url $ApiHealthUrl
    }

    if (-not $McpReady) {
        $McpReady = Test-HealthEndpoint `
            -Name "MCP" `
            -Url $McpHealthUrl
    }

    if ($ApiReady -and $McpReady) {
        break
    }

    $Elapsed = [int]((Get-Date) - $WakeStart).TotalSeconds

    if ($Elapsed -ge $WakeTimeoutSeconds) {

        Write-Host ""
        Write-Host "API ready : $ApiReady"
        Write-Host "MCP ready : $McpReady"

        throw "EverJobs did not become healthy within $WakeTimeoutSeconds seconds."
    }

    Write-Host ""
    Write-Host "Retrying in $PollSeconds seconds..."

    Start-Sleep -Seconds $PollSeconds
}

# ============================================================
# Complete
# ============================================================

$TotalElapsed = [int]((Get-Date) - $StartTime).TotalSeconds

Write-Host ""
Write-Host "============================================================"
Write-Host " EverJobs deployment complete"
Write-Host "============================================================"
Write-Host ""

Write-Host "Commit:"
git log -1 --oneline

Write-Host ""
Write-Host "Images:"
Write-Host "  API : $ApiRemoteImage"
Write-Host "  MCP : $McpRemoteImage"

Write-Host ""
Write-Host "Health:"
Write-Host "  API : READY"
Write-Host "  MCP : READY"

Write-Host ""
Write-Host "Total deployment time: $TotalElapsed seconds"
Write-Host ""
Write-Host "EverJobs is ready for searches."
Write-Host ""