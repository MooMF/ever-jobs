[CmdletBinding()]
param(
    [string]$ResourceGroup = "",
    [string]$McpApp = "",
    [string]$ApiApp = "",
    [string]$McpUrl = "",
    [string]$Query = "senior C# .NET developer technical lead",
    [string]$Location = "United Kingdom",
    [int]$Limit = 100,
    [switch]$SkipColdStart,
    [int]$ScaleDownTimeoutSeconds = 900,
    [int]$PollSeconds = 10,
    [int]$SearchTimeoutSeconds = 300,
    [int]$DetailsTimeoutSeconds = 120,
    [int]$LogLookbackMinutes = 30,
    [switch]$FullLogs,
    [string]$OutputDirectory = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\EverJobs.Common.ps1"

if ([string]::IsNullOrWhiteSpace($ResourceGroup)) {
    $ResourceGroup = $EverJobsResourceGroup
}

if ([string]::IsNullOrWhiteSpace($McpApp)) {
    $McpApp = $EverJobsMcpApp
}

if ([string]::IsNullOrWhiteSpace($ApiApp)) {
    $ApiApp = $EverJobsApiApp
}

if ([string]::IsNullOrWhiteSpace($McpUrl)) {
    $McpUrl = $EverJobsMcpUrl
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = $EverJobsLogDirectory
}

function Step([string]$Text) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host " $Text" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

function Active-Revision([string]$App) {
    $r = az containerapp revision list `
        --name $App --resource-group $ResourceGroup `
        --query "[?properties.active].name | [0]" -o tsv
    if ($LASTEXITCODE -ne 0 -or -not $r) { throw "Cannot find active revision for $App" }
    $r.Trim()
}

function Replica-Count([string]$App, [string]$Revision) {
    $json = az containerapp replica list `
        --name $App `
        --resource-group $ResourceGroup `
        --revision $Revision `
        --output json

    if ($LASTEXITCODE -ne 0) {
        throw "Cannot read replicas for $App/$Revision"
    }

    if (-not $json) {
        return 0
    }

    $replicas = $json | ConvertFrom-Json
    return @($replicas).Count
}

function Wait-For-Zero([string]$App) {
    $revision = Active-Revision $App
    Write-Host "Active revision: $revision"

    $deadline = (Get-Date).AddSeconds($ScaleDownTimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $n = Replica-Count $App $revision
        Write-Host ("{0:HH:mm:ss} replicas={1}" -f (Get-Date), $n)
        if ($n -eq 0) { return $revision }
        Start-Sleep -Seconds $PollSeconds
    }

    throw "$App did not scale to zero within $ScaleDownTimeoutSeconds seconds. Aborting cold-start test rather than treating a restart as a true cold start."
}

function Mcp-Call([int]$Id, [string]$Tool, [hashtable]$Arguments, [int]$Timeout, [string]$OutFile) {
    $body = @{
        jsonrpc = "2.0"
        id      = $Id
        method  = "tools/call"
        params  = @{
            name      = $Tool
            arguments = $Arguments
        }
    } | ConvertTo-Json -Depth 12

    $r = Invoke-WebRequest `
        -Uri $McpUrl -Method Post `
        -ContentType "application/json" `
        -Headers @{ Accept = "application/json, text/event-stream" } `
        -Body $body -TimeoutSec $Timeout

    $r.Content | Set-Content $OutFile -Encoding utf8
    $r.Content
}

function Mcp-Envelope([string]$Text) {
    $line = @($Text -split "`r?`n" | Where-Object { $_ -like "data: *" })[-1]
    if (-not $line) { throw "No MCP data event found" }
    $line.Substring(6) | ConvertFrom-Json
}

function Mcp-JsonPayload([string]$Text) {
    $e = Mcp-Envelope $Text

    $isError = $false

    if ($e.result.PSObject.Properties.Name -contains "isError") {
        $isError = [bool]$e.result.isError
    }

    if ($isError) {
        throw $e.result.content[0].text
    }

    $e.result.content[0].text | ConvertFrom-Json
}

function Workspace-Id {
    $envId = az containerapp show `
        --name $McpApp --resource-group $ResourceGroup `
        --query "properties.managedEnvironmentId" -o tsv
    if ($LASTEXITCODE -ne 0 -or -not $envId) { throw "Cannot determine Container Apps environment" }

    $ws = az containerapp env show `
        --ids $envId.Trim() `
        --query "properties.appLogsConfiguration.logAnalyticsConfiguration.customerId" -o tsv
    if ($LASTEXITCODE -ne 0 -or -not $ws) { throw "Cannot determine Log Analytics workspace" }

    $ws.Trim()
}

# ---- main ---------------------------------------------------------------

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI is required."
}
az account show -o none
if ($LASTEXITCODE -ne 0) { throw "Run 'az login' first." }

$startedUtc = (Get-Date).ToUniversalTime()
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runDir = Join-Path $OutputDirectory "test-$stamp"
New-Item -ItemType Directory -Force -Path $runDir | Out-Null

$healthUrl = $McpUrl -replace "/mcp$", "/health"

$summary = [ordered]@{
    startedUtc = $startedUtc.ToString("o")
    coldStart  = $null
    search     = $null
    details    = $null
    logs       = $null
}

Write-Host "Output: $runDir"

if (-not $SkipColdStart) {
    Step "Cold-start check"

    $revision = Active-Revision $McpApp
    Write-Host "Active revision: $revision"

    $replicas = Replica-Count $McpApp $revision
    Write-Host ("{0:HH:mm:ss} replicas={1}" -f (Get-Date), $replicas)

    if ($replicas -eq 0) {
        Step "Cold start - first public health request"

        $sw = [Diagnostics.Stopwatch]::StartNew()
        $h = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 180
        $sw.Stop()

        $summary.coldStart = [ordered]@{
            tested     = $true
            revision   = $revision
            replicas   = $replicas
            statusCode = [int]$h.StatusCode
            elapsedSec = [math]::Round($sw.Elapsed.TotalSeconds, 2)
        }

        Write-Host ("Cold start: HTTP {0}, {1}s" -f `
            $h.StatusCode,
            $summary.coldStart.elapsedSec)
    }
    else {
        $summary.coldStart = [ordered]@{
            tested   = $false
            revision = $revision
            replicas = $replicas
            reason   = "Skipped because MCP already had an active replica."
        }

        Write-Host "Cold start skipped: MCP is already warm."
    }
}

Step "Broad MCP search"
$searchFile = Join-Path $runDir "mcp-wide-search.txt"
$sw = [Diagnostics.Stopwatch]::StartNew()

$searchRaw = Mcp-Call 100 "search_jobs" @{
    query    = $Query
    location = $Location
    limit    = $Limit
} $SearchTimeoutSeconds $searchFile

$sw.Stop()
$search = Mcp-JsonPayload $searchRaw
$searchJson = Join-Path $runDir "mcp-wide-search.json"
$search | ConvertTo-Json -Depth 20 | Set-Content $searchJson -Encoding utf8

$summary.search = [ordered]@{
    elapsedSec   = [math]::Round($sw.Elapsed.TotalSeconds, 2)
    returnedJobs = $search.total
    sourceCount  = @($search.sources_searched).Count
    sources      = @($search.sources_searched)
    rawFile      = $searchFile
    jsonFile     = $searchJson
}

Write-Host ("Search: {0} jobs / {1} sources / {2}s" -f `
    $search.total, @($search.sources_searched).Count, $summary.search.elapsedSec)

Step "Details test - first job returned by broad search"

if (@($search.jobs).Count -gt 0) {
    $job = $search.jobs[0]
    Write-Host ("Testing: [{0}] {1} - {2}" -f $job.source, $job.company, $job.title)

    $detailsFile = Join-Path $runDir "mcp-job-details.txt"
    $sw = [Diagnostics.Stopwatch]::StartNew()

    try {
        $raw = Mcp-Call 101 "get_job_details" @{
            job_url = $job.url
            job_id  = $job.id
            source  = $job.source
        } $DetailsTimeoutSeconds $detailsFile

        $sw.Stop()
        $e = Mcp-Envelope $raw

        $isError = $false

        if ($e.result.PSObject.Properties.Name -contains "isError") {
            $isError = [bool]$e.result.isError
        }

        if ($isError) {
            $summary.details = [ordered]@{
                success    = $false
                elapsedSec = [math]::Round($sw.Elapsed.TotalSeconds, 2)
                message    = $e.result.content[0].text
                selected   = $job
                rawFile    = $detailsFile
            }
        }
        else {
            $d = $e.result.content[0].text | ConvertFrom-Json
            $detailsJson = Join-Path $runDir "mcp-job-details.json"
            $d | ConvertTo-Json -Depth 20 | Set-Content $detailsJson -Encoding utf8

            $summary.details = [ordered]@{
                success            = $true
                elapsedSec         = [math]::Round($sw.Elapsed.TotalSeconds, 2)
                hasFullDescription = -not [string]::IsNullOrWhiteSpace([string]$d.full_description)
                selected           = $job
                rawFile            = $detailsFile
                jsonFile           = $detailsJson
            }
        }
    }
    catch {
        if ($sw.IsRunning) { $sw.Stop() }
        $summary.details = [ordered]@{
            success    = $false
            elapsedSec = [math]::Round($sw.Elapsed.TotalSeconds, 2)
            message    = $_.Exception.Message
            selected   = $job
        }
    }
}
else {
    $summary.details = [ordered]@{
        success = $false
        message = "No jobs returned; details test skipped."
    }
}

if ($summary.details.success) {
    Write-Host ("Details: PASS; full_description={0}" -f $summary.details.hasFullDescription)
}
else {
    Write-Warning ("Details: FAIL; {0}" -f $summary.details.message)
}

Step "Download API + MCP logs"

$from = $startedUtc.AddMinutes(-5)

$lookback =
    (Get-Date).
    ToUniversalTime().
    AddMinutes(-$LogLookbackMinutes)

if ($lookback -lt $from) {
    $from = $lookback
}

# Give Log Analytics a small ingestion cushion.
$to =
    (Get-Date).
    ToUniversalTime().
    AddMinutes(2)

try {

    $logParams = @{
        FromUtc         = $from
        ToUtc           = $to
        Apps            = @(
            $ApiApp,
            $McpApp
        )
        OutputDirectory = $runDir
        BaseName        = "azure-logs"
        NoZip           = $true
    }

    # Test bundles are lightweight by default.
    # -FullLogs includes raw Log Analytics JSON.
    if (-not $FullLogs) {
        $logParams.Lightweight = $true
    }

    $logs =
        Export-EverJobsLogs @logParams

    $summary.logs = [ordered]@{
        success         = $true
        mode            =
            $(if ($FullLogs) {
                "full"
            }
            else {
                "lightweight"
            })

        rowCount        = $logs.Count
        diagnosticRows = $logs.DiagnosticCount
        errorRows      = $logs.ErrorCount
        warningRows    = $logs.WarningCount

        fromUtc         = $logs.FromUtc.ToString("o")
        toUtc           = $logs.ToUtc.ToString("o")

        actualFirstUtc  =
            $(if ($logs.ActualFirstUtc) {
                $logs.ActualFirstUtc.ToString("o")
            }
            else {
                $null
            })

        actualLastUtc   =
            $(if ($logs.ActualLastUtc) {
                $logs.ActualLastUtc.ToString("o")
            }
            else {
                $null
            })

        directory       = $logs.Directory
        manifestFile    = $logs.Manifest
        queryFile       = $logs.Query
        textFile        = $logs.Logs
        diagnosticsFile = $logs.Diagnostics
        jsonFile        = $logs.Json
    }

    Write-Host (
        "Logs: {0} rows; {1} diagnostic; {2} error-like" -f `
        $logs.Count,
        $logs.DiagnosticCount,
        $logs.ErrorCount
    )
}
catch {

    $summary.logs = [ordered]@{
        success = $false
        message = $_.Exception.Message
    }

    Write-Warning (
        "Logs failed: {0}" -f
        $_.Exception.Message
    )
}

Step "Summary"
$summary.finishedUtc = (Get-Date).ToUniversalTime().ToString("o")
$zipPath = "$runDir.zip"
$summary.archive = [ordered]@{
    zipFile = $zipPath
}
$summaryFile = Join-Path $runDir "test-summary.json"
$summary | ConvertTo-Json -Depth 30 |
    Set-Content $summaryFile -Encoding utf8

if ($summary.coldStart) {
    if (
        ($summary.coldStart.PSObject.Properties.Name -contains "tested") -and
        $summary.coldStart.tested
    ) {
        Write-Host ("Cold start : {0}s" -f $summary.coldStart.elapsedSec)
    }
    else {
        Write-Host "Cold start : SKIPPED (MCP already warm)"
    }
}

Write-Host ("Search     : {0} jobs / {1} sources / {2}s" -f `
    $summary.search.returnedJobs, $summary.search.sourceCount, $summary.search.elapsedSec)
Write-Host ("Details    : {0}" -f $(if ($summary.details.success) { "PASS" } else { "FAIL" }))
Write-Host ("Logs       : {0}" -f $(if ($summary.logs.success) { "$($summary.logs.rowCount) rows" } else { "FAILED" }))

Step "Create ZIP archive"
$zipPath = "$runDir.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive `
    -Path (Join-Path $runDir "*") `
    -DestinationPath $zipPath `
    -CompressionLevel Optimal

Write-Host "ZIP        : $zipPath"
Write-Host "Output     : $runDir"