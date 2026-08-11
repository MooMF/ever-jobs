param(
    [int]$TimeoutSeconds = 300,
    [int]$PollSeconds = 10
)

$ErrorActionPreference = "Stop"

$McpHealthUrl = "https://ever-jobs-mcp.nicegrass-ebb7ee5d.uksouth.azurecontainerapps.io/health"
$McpUrl       = "https://ever-jobs-mcp.nicegrass-ebb7ee5d.uksouth.azurecontainerapps.io/mcp"

$SearchQuery    = "warehouse"
$SearchLocation = "England"
$SearchLimit    = 10

$StartTime = Get-Date


function Test-McpHealth {
    try {
        $response = Invoke-WebRequest `
            -Uri $McpHealthUrl `
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
        $status = $_.Exception.Response.StatusCode.value__

        if ($status) {
            Write-Host "MCP waiting ($status)"
        }
        else {
            Write-Host "MCP waiting..."
        }

        return $false
    }
}


function Get-JsonRpcResponse {
    param(
        [string]$Content
    )

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $null
    }

    $trimmed = $Content.Trim()

    # Normal JSON response
    if ($trimmed.StartsWith("{")) {
        try {
            return $trimmed | ConvertFrom-Json
        }
        catch {
            return $null
        }
    }

    # Streamable HTTP / SSE response
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


function Test-EverJobsSearch {

    Write-Host ""
    Write-Host "Testing EverJobs through MCP..."
    Write-Host "Query:    $SearchQuery"
    Write-Host "Location: $SearchLocation"
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
                query    = $SearchQuery
                location = $SearchLocation
                limit    = $SearchLimit
            }
        }
    } | ConvertTo-Json -Depth 10

    try {

        $response = Invoke-WebRequest `
            -Method Post `
            -Uri $McpUrl `
            -Headers $headers `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 150

        $rpcResponse =
            Get-JsonRpcResponse `
                -Content $response.Content

        if (-not $rpcResponse) {
            Write-Host "Search returned an unreadable MCP response."
            return $false
        }

        if ($rpcResponse.error) {
            Write-Host "MCP search error: $($rpcResponse.error.message)"
            return $false
        }

        if (-not $rpcResponse.result) {
            Write-Host "MCP search returned no result object."
            return $false
        }

        $textContent =
            $rpcResponse.result.content |
            Where-Object {
                $_.type -eq "text"
            } |
            Select-Object -First 1

        if (-not $textContent) {
            Write-Host "MCP search returned no text content."
            return $false
        }

        try {
            $searchResult =
                $textContent.text |
                ConvertFrom-Json
        }
        catch {
            Write-Host "MCP search result could not be parsed as JSON."
            Write-Host $textContent.text
            return $false
        }

        $jobCount = 0

        if ($null -ne $searchResult.total) {
            $jobCount =
                [int]$searchResult.total
        }
        elseif ($searchResult.jobs) {
            $jobCount =
                @($searchResult.jobs).Count
        }

        if ($jobCount -le 0) {
            Write-Host "Search completed but returned zero jobs."
            return $false
        }

        Write-Host ""
        Write-Host "Search returned $jobCount job(s)."

        if ($searchResult.jobs) {

            Write-Host ""
            Write-Host "Sample results:"

            $searchResult.jobs |
                Select-Object -First 5 |
                ForEach-Object {

                    $company =
                        if ($_.company) {
                            $_.company
                        }
                        else {
                            "Unknown company"
                        }

                    $location =
                        if ($_.location) {
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

        $status =
            $_.Exception.Response.StatusCode.value__

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


Write-Host ""
Write-Host "================================"
Write-Host " Waking EverJobs"
Write-Host "================================"
Write-Host ""


#
# Stage 1
# Wake the public MCP endpoint.
#

while ($true) {

    if (Test-McpHealth) {
        break
    }

    $Elapsed =
        ((Get-Date) - $StartTime).TotalSeconds

    if ($Elapsed -ge $TimeoutSeconds) {

        Write-Host ""

        Write-Error `
            "MCP failed to become healthy within $TimeoutSeconds seconds."

        exit 1
    }

    Write-Host `
        "Retrying MCP health in $PollSeconds seconds..."

    Write-Host ""

    Start-Sleep `
        -Seconds $PollSeconds
}


#
# Stage 2
# Prove:
#
# MCP -> API -> scraper -> results
#

while ($true) {

    if (Test-EverJobsSearch) {

        $Elapsed =
            [int](
                ((Get-Date) - $StartTime)
                .TotalSeconds
            )

        Write-Host ""
        Write-Host "================================"
        Write-Host " EverJobs is awake and working"
        Write-Host " MCP:    healthy"
        Write-Host " Search: returned results"
        Write-Host " Time:   $Elapsed seconds"
        Write-Host "================================"
        Write-Host ""

        exit 0
    }

    $Elapsed =
        ((Get-Date) - $StartTime).TotalSeconds

    if ($Elapsed -ge $TimeoutSeconds) {

        Write-Host ""

        Write-Error `
            "EverJobs did not return search results within $TimeoutSeconds seconds."

        exit 1
    }

    Write-Host ""
    Write-Host `
        "Retrying search in $PollSeconds seconds..."
    Write-Host ""

    Start-Sleep `
        -Seconds $PollSeconds
}