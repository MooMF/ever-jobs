param(
    [int]$TimeoutSeconds = 180,
    [int]$PollSeconds = 10
)

$ApiUrl = "https://ever-jobs-api.nicegrass-ebb7ee5d.uksouth.azurecontainerapps.io/health"
$McpUrl = "https://ever-jobs-mcp.nicegrass-ebb7ee5d.uksouth.azurecontainerapps.io/health"

$StartTime = Get-Date

$ApiReady = $false
$McpReady = $false

function Test-Endpoint {
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
            Write-Host "$Name READY ($($response.StatusCode))"
            return $true
        }

        Write-Host "$Name waiting ($($response.StatusCode))"
        return $false
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__

        if ($status) {
            Write-Host "$Name waiting ($status)"
        }
        else {
            Write-Host "$Name waiting..."
        }

        return $false
    }
}

Write-Host ""
Write-Host "=== Waking EverJobs ==="
Write-Host ""

while ($true) {

    if (-not $ApiReady) {
        $ApiReady = Test-Endpoint `
            -Name "API" `
            -Url $ApiUrl
    }

    if (-not $McpReady) {
        $McpReady = Test-Endpoint `
            -Name "MCP" `
            -Url $McpUrl
    }

    if ($ApiReady -and $McpReady) {

        $Elapsed = [int]((Get-Date) - $StartTime).TotalSeconds

        Write-Host ""
        Write-Host "=============================="
        Write-Host " EverJobs is awake"
        Write-Host " Startup time: $Elapsed seconds"
        Write-Host "=============================="

        exit 0
    }

    $Elapsed = ((Get-Date) - $StartTime).TotalSeconds

    if ($Elapsed -ge $TimeoutSeconds) {

        Write-Host ""
        Write-Error "EverJobs failed to become healthy within $TimeoutSeconds seconds."

        Write-Host "API ready: $ApiReady"
        Write-Host "MCP ready: $McpReady"

        exit 1
    }

    Write-Host "Retrying in $PollSeconds seconds..."
    Write-Host ""

    Start-Sleep -Seconds $PollSeconds
}
