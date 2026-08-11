$ErrorActionPreference = "Stop"

# ============================================================
# Repository
# ============================================================

$EverJobsRepoPath = "C:\repos\EverJobs\ever-jobs"

# ============================================================
# Azure
# ============================================================

$EverJobsResourceGroup = "ever-jobs-rg"

$EverJobsAcrName   = "ca799bf66e13acr"
$EverJobsAcrServer = "$EverJobsAcrName.azurecr.io"

$EverJobsApiApp = "ever-jobs-api"
$EverJobsMcpApp = "ever-jobs-mcp"

# ============================================================
# Docker
# ============================================================

$EverJobsApiImage = "ever-jobs-api"
$EverJobsMcpImage = "ever-jobs-mcp"

$EverJobsApiDockerfile = "Dockerfile.api"
$EverJobsMcpDockerfile = "Dockerfile.mcp"

# ============================================================
# Public endpoints
# ============================================================

$EverJobsApiHealthUrl = "https://ever-jobs-api.nicegrass-ebb7ee5d.uksouth.azurecontainerapps.io/health"

$EverJobsMcpHealthUrl = "https://ever-jobs-mcp.nicegrass-ebb7ee5d.uksouth.azurecontainerapps.io/health"

$EverJobsMcpUrl = "https://ever-jobs-mcp.nicegrass-ebb7ee5d.uksouth.azurecontainerapps.io/mcp"

# ============================================================
# Wake probe
# ============================================================

$EverJobsProbeQuery    = "warehouse"
$EverJobsProbeLocation = "England"
$EverJobsProbeSource   = "linkedin"
$EverJobsProbeLimit    = 10

# ============================================================
# Helpers
# ============================================================

function Write-EverJobsHeader {
    param(
        [string]$Title
    )

    Write-Host ""
    Write-Host "============================================================"
    Write-Host " $Title"
    Write-Host "============================================================"
    Write-Host ""
}

function Assert-EverJobsLastCommand {
    param(
        [string]$Message
    )

    if ($LASTEXITCODE -ne 0) {
        throw $Message
    }
}

function Set-EverJobsRepoLocation {

    Set-Location $EverJobsRepoPath
}

function Assert-EverJobsDocker {

    docker info *> $null

    if ($LASTEXITCODE -ne 0) {
        throw "Docker Desktop is not ready."
    }
}

function Connect-EverJobsAzure {

    az account show *> $null

    if ($LASTEXITCODE -ne 0) {

        Write-Host "Azure session not available."
        Write-Host "Starting Azure login..."
        Write-Host ""

        az login

        Assert-EverJobsLastCommand `
            "Azure login failed."
    }

    $subscription = az account show `
        --query name `
        -o tsv

    Assert-EverJobsLastCommand `
        "Unable to determine Azure subscription."

    Write-Host "Azure subscription: $subscription"
}

function Connect-EverJobsAcr {

    Connect-EverJobsAzure

    Write-Host ""
    Write-Host "Logging into Azure Container Registry..."

    az acr login `
        --name $EverJobsAcrName

    Assert-EverJobsLastCommand `
        "ACR login failed."
}

function Get-EverJobsTag {

    return Get-Date -Format "yyyyMMdd-HHmmss"
}