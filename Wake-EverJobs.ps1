param(
    [int]$TimeoutSeconds = 180,
    [int]$PollSeconds = 10
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\EverJobs.Common.ps1"

$startTime = Get-Date

function Test-EverJobsMcpHealth {

    try {

        $response = Invoke-WebRequest `
            -Uri $EverJobsMcpHealthUrl `
            -Method Get `
            -TimeoutSec 15

        if (
            $response.StatusCode -ge 200 -and
            $response.StatusCode -lt 300
        ) {

            Write-Host "MCP READY ($($response.StatusCode))"

            return $true
        }

        Write-Host "MCP waiting ($($response.StatusCode))"

        return $false
    }
    catch {

        try {

            $status = [int]$_.Exception.Response.StatusCode

            Write-Host "MCP waiting ($status)"
        }
        catch {

            Write-Host "MCP waiting..."
        }

        return $false
    }
}

function Get-EverJobsJsonRpcResponse {

    param(
        [string]$Content
    )

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $null
    }

    $trimmed = $Content.Trim()

    # Plain JSON
    if ($trimmed.StartsWith("{")) {

        try {
            return $trimmed | ConvertFrom-Json
        }
        catch {
            return $null
        }
    }

    # Streamable HTTP / SSE
    $dataLines = $Content -split "`r?`n" |
        Where-Object {
            $_ -match '^data:\s*'
        }

    foreach ($line in $dataLines) {

        $json = $line -replace '^data:\s*', ''

        if ($json -eq "[DONE]") {
            continue
        }

        try {
            return $json | ConvertFrom-Json
        }
        catch {
            continue
        }
    }

    return $null
}

function Test-EverJobsLinkedInSearch {

    Write-Host ""
    Write-Host "Testing EverJobs end-to-end..."
    Write-Host "  Query    : $EverJobsProbeQuery"
    Write-Host "  Location : $EverJobsProbeLocation"
    Write-Host "  Source   : $EverJobsProbeSource"
    Write-Host ""

    $headers = @{
        Accept = "application/json, text/event-stream"
    }

    $body = @{
        jsonrpc = "2.0"
        id      = 1
        method  = "tools/call"
        params  = @{
            name = "search_jobs"
            arguments = @{
                query    = $EverJobsProbeQuery
                location = $EverJobsProbeLocation
                source   = $EverJobsProbeSource
                limit    = $EverJobsProbeLimit
            }
        }
    } | ConvertTo-Json -Depth 10

    try {

        $response = Invoke-WebRequest `
            -Method Post `
            -Uri $EverJobsMcpUrl `
            -Headers $headers `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 90

        $rpcResponse = Get-EverJobsJsonRpcResponse `
            -Content $response.Content

        if (-not $rpcResponse) {

            Write-Host "MCP returned an unreadable response."

            return $false
        }

        if ($rpcResponse.error) {

            Write-Host "MCP error: $($rpcResponse.error.message)"

            return $false
        }

        if ($rpcResponse.result.isError -eq $true) {

            $errorContent = $rpcResponse.result.content |
                Where-Object {
                    $_.type -eq "text"
                } |
                Select-Object -First 1

            if ($errorContent) {
                Write-Host "Search failed: $($errorContent.text)"
            }
            else {
                Write-Host "Search failed."
            }

            return $false
        }

        $textContent = $rpcResponse.result.content |
            Where-Object {
                $_.type -eq "text"
            } |
            Select-Object -First 1

        if (-not $textContent) {

            Write-Host "MCP returned no search result content."

            return $false
        }

        try {

            $searchResult = $textContent.text |
                ConvertFrom-Json
        }
        catch {

            Write-Host "Search result was not valid JSON."
            Write-Host $textContent.text

            return $false
        }

        $jobCount = 0

        if ($null -ne $searchResult.total) {

            $jobCount = [int]$searchResult.total
        }
        elseif ($searchResult.jobs) {

            $jobCount = @($searchResult.jobs).Count
        }

        if ($jobCount -le 0) {

            Write-Host "LinkedIn search returned zero jobs."

            return $false
        }

        Write-Host ""
        Write-Host "LinkedIn search returned $jobCount job(s)."

        if ($searchResult.jobs) {

            Write-Host ""
            Write-Host "Sample results:"

            $searchResult.jobs |
                Select-Object -First 5 |
                ForEach-Object {

                    $company = if ($_.company) {
                        $_.company
                    }
                    else {
                        "Unknown company"
                    }

                    $location = if ($_.location) {
                        $_.location
                    }
                    else {
                        "Unknown location"
                    }

                    Write-Host `
                        "  - $($_.title) | $company | $location"
                }
        }

        return $true
    }
    catch {

        try {
            $status = [int]$_.Exception.Response.StatusCode
        }
        catch {
            $status = $null
        }

        if ($status) {

            Write-Host `
                "Search request failed ($status): $($_.Exception.Message)"
        }
        else {

            Write-Host `
                "Search request failed: $($_.Exception.Message)"
        }

        return $false
    }
}

# ============================================================
# Start
# ============================================================

Write-EverJobsHeader "Waking EverJobs"

# ============================================================
# MCP health
# ============================================================

while ($true) {

    if (Test-EverJobsMcpHealth) {
        break
    }

    $elapsed = [int](
        (Get-Date) - $startTime
    ).TotalSeconds

    if ($elapsed -ge $TimeoutSeconds) {

        throw `
            "MCP failed to become healthy within $TimeoutSeconds seconds."
    }

    Write-Host ""
    Write-Host "Retrying MCP health in $PollSeconds seconds..."

    Start-Sleep `
        -Seconds $PollSeconds
}

# ============================================================
# End-to-end LinkedIn probe
# ============================================================

while ($true) {

    if (Test-EverJobsLinkedInSearch) {
        break
    }

    $elapsed = [int](
        (Get-Date) - $startTime
    ).TotalSeconds

    if ($elapsed -ge $TimeoutSeconds) {

        throw `
            "EverJobs failed the LinkedIn end-to-end probe within $TimeoutSeconds seconds."
    }

    Write-Host ""
    Write-Host "Retrying LinkedIn probe in $PollSeconds seconds..."

    Start-Sleep `
        -Seconds $PollSeconds
}

$elapsed = [int](
    (Get-Date) - $startTime
).TotalSeconds

Write-Host ""
Write-Host "============================================================"
Write-Host " EverJobs is awake"
Write-Host ""
Write-Host " MCP      : READY"
Write-Host " API      : REACHED THROUGH MCP"
Write-Host " LinkedIn : RESULTS RETURNED"
Write-Host ""
Write-Host " Startup time: $elapsed seconds"
Write-Host "============================================================"
Write-Host ""