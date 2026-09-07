$ErrorActionPreference = "Stop"

# ============================================================
# Repository-local defaults
# ============================================================

$EverJobsRepoPath = $PSScriptRoot
$EverJobsLogDirectory = $null

# ============================================================
# Deployment-local configuration
# ============================================================

$EverJobsResourceGroup = $null
$EverJobsEnvironment = $null
$EverJobsAcrName = $null
$EverJobsApiApp = $null
$EverJobsMcpApp = $null
$EverJobsApiHealthUrl = $null
$EverJobsMcpHealthUrl = $null
$EverJobsMcpUrl = $null

$EverJobsLocalConfigPath =
    Join-Path $PSScriptRoot "EverJobs.Local.ps1"

if (-not (Test-Path $EverJobsLocalConfigPath -PathType Leaf)) {
    throw (
        "Missing local EverJobs configuration: $EverJobsLocalConfigPath. " +
        "Copy EverJobs.Local.example.ps1 to EverJobs.Local.ps1 and fill in " +
        "the machine/Azure-specific values."
    )
}

. $EverJobsLocalConfigPath

$requiredLocalSettings = @(
    "EverJobsResourceGroup",
    "EverJobsEnvironment",
    "EverJobsAcrName",
    "EverJobsApiApp",
    "EverJobsMcpApp",
    "EverJobsApiHealthUrl",
    "EverJobsMcpHealthUrl",
    "EverJobsMcpUrl"
)

foreach ($settingName in $requiredLocalSettings) {
    $settingValue = Get-Variable `
        -Name $settingName `
        -ValueOnly `
        -ErrorAction SilentlyContinue

    if ([string]::IsNullOrWhiteSpace([string]$settingValue)) {
        throw "EverJobs local configuration value '$settingName' is missing."
    }
}

if ([string]::IsNullOrWhiteSpace([string]$EverJobsRepoPath)) {
    $EverJobsRepoPath = $PSScriptRoot
}

if ([string]::IsNullOrWhiteSpace([string]$EverJobsLogDirectory)) {
    $EverJobsLogDirectory = Join-Path $EverJobsRepoPath "logs"
}

$EverJobsAcrServer = "$EverJobsAcrName.azurecr.io"

# ============================================================
# Docker
# ============================================================

$EverJobsApiImage = "ever-jobs-api"
$EverJobsMcpImage = "ever-jobs-mcp"

$EverJobsApiDockerfile = "Dockerfile.api"
$EverJobsMcpDockerfile = "Dockerfile.mcp"

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

function Assert-EverJobsTelemetryMount {

    Write-Host ""
    Write-Host "Verifying telemetry storage mount..."

    $mountJson = az containerapp show `
        --name $EverJobsApiApp `
        --resource-group $EverJobsResourceGroup `
        --query "{Volumes:properties.template.volumes,Mounts:properties.template.containers[0].volumeMounts}" `
        -o json

    Assert-EverJobsLastCommand `
        "Unable to inspect API telemetry mount."

    $mountInfo = $mountJson | ConvertFrom-Json

    $volume = @($mountInfo.Volumes) |
        Where-Object {
            $_.name -eq "telemetry-volume" -and
            $_.storageName -eq "telemetry" -and
            $_.storageType -eq "AzureFile"
        } |
        Select-Object -First 1

    $mount = @($mountInfo.Mounts) |
        Where-Object {
            $_.volumeName -eq "telemetry-volume" -and
            $_.mountPath -eq "/app/telemetry"
        } |
        Select-Object -First 1

    if (-not $volume) {
        throw "Telemetry AzureFile volume is missing from EverJobs API."
    }

    if (-not $mount) {
        throw "Telemetry volume is not mounted at /app/telemetry."
    }

    Write-Host "Telemetry volume : READY"
    Write-Host "Mount path       : /app/telemetry"
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

# ============================================================
# Log Analytics
# ============================================================

function Get-EverJobsLogWorkspaceId {
    param(
        [string]$Environment = $EverJobsEnvironment,
        [string]$ResourceGroup = $EverJobsResourceGroup
    )

    $workspaceId = az containerapp env show `
        --name $Environment `
        --resource-group $ResourceGroup `
        --query "properties.appLogsConfiguration.logAnalyticsConfiguration.customerId" `
        -o tsv `
        --only-show-errors

    Assert-EverJobsLastCommand `
        "Unable to determine EverJobs Log Analytics workspace."

    if ([string]::IsNullOrWhiteSpace($workspaceId)) {
        throw "EverJobs Log Analytics workspace ID was empty."
    }

    return $workspaceId.Trim()
}

function Export-EverJobsLogs {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [datetime]$FromUtc,

        [Parameter(Mandatory = $true)]
        [datetime]$ToUtc,

        [string[]]$Apps = @(
            $EverJobsApiApp,
            $EverJobsMcpApp
        ),

        [string]$OutputDirectory = "",

        [string]$BaseName = "",

        [switch]$Lightweight,

        [switch]$NoZip,

        [string]$WorkspaceId = ""
    )

    $utf8 = [System.Text.UTF8Encoding]::new($false)

    $FromUtc = $FromUtc.ToUniversalTime()
    $ToUtc   = $ToUtc.ToUniversalTime()

    if ($FromUtc -ge $ToUtc) {
        throw "Log start time must be earlier than log end time."
    }

    if ([string]::IsNullOrWhiteSpace($WorkspaceId)) {
        $WorkspaceId = Get-EverJobsLogWorkspaceId
    }

    # Resolve output directory deterministically.
    # Relative paths are always relative to the EverJobs repository,
    # not the caller's current PowerShell location.

    if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
        $OutputDirectory = $EverJobsLogDirectory
    }
    elseif (-not [System.IO.Path]::IsPathRooted($OutputDirectory)) {

        $relativePath = $OutputDirectory

        if ($relativePath.StartsWith(".\")) {
            $relativePath = $relativePath.Substring(2)
        }
        elseif ($relativePath.StartsWith("./")) {
            $relativePath = $relativePath.Substring(2)
        }

        $OutputDirectory = Join-Path $EverJobsRepoPath $relativePath
    }

    $OutputDirectory =
        [System.IO.Path]::GetFullPath($OutputDirectory)

    New-Item `
        -ItemType Directory `
        -Force `
        -Path $OutputDirectory |
        Out-Null

    if (-not (Test-Path $OutputDirectory -PathType Container)) {
        throw "Could not create log output directory: $OutputDirectory"
    }

    if ([string]::IsNullOrWhiteSpace($BaseName)) {
        $BaseName = "everjobs-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    }

    $bundleDirectory = Join-Path $OutputDirectory $BaseName
    $zipFile         = Join-Path $OutputDirectory "$BaseName.zip"

    if (Test-Path $bundleDirectory) {
        Remove-Item `
            -Path $bundleDirectory `
            -Recurse `
            -Force
    }

    New-Item `
        -ItemType Directory `
        -Force `
        -Path $bundleDirectory |
        Out-Null

    if (-not (Test-Path $bundleDirectory -PathType Container)) {
        throw "Could not create log bundle directory: $bundleDirectory"
    }

    if (Test-Path $zipFile) {
        Remove-Item `
            -Path $zipFile `
            -Force
    }

    $fromText = $FromUtc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $toText   = $ToUtc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

    $timespan = "$fromText/$toText"

    $quotedApps = $Apps |
        ForEach-Object {
            "`"$_`""
        }

    $appList = $quotedApps -join ", "

    $query = @"
ContainerAppConsoleLogs_CL
| where TimeGenerated >= datetime($fromText)
| where TimeGenerated <= datetime($toText)
| where ContainerAppName_s in ($appList)
| project
    TimeGenerated,
    ContainerAppName_s,
    RevisionName_s,
    Log_s
| order by TimeGenerated asc
"@

    $queryFile = Join-Path $bundleDirectory "query.kql"

    [System.IO.File]::WriteAllText(
        $queryFile,
        $query,
        $utf8
    )

    Write-Host "Querying EverJobs logs..."
    Write-Host "Workspace : $WorkspaceId"
    Write-Host "From UTC  : $fromText"
    Write-Host "To UTC    : $toText"
    Write-Host "Mode      : $(if ($Lightweight) { 'Lightweight' } else { 'Full' })"
    Write-Host ""

    $logsEndpoint = "https://api.loganalytics.io"

    $uri =
        "$logsEndpoint/v1/workspaces/$WorkspaceId/query"

    $requestBody = @{
        query    = $query
        timespan = $timespan
    } | ConvertTo-Json -Depth 10

    $tempBodyFile =
        Join-Path $env:TEMP "everjobs-log-query-$([guid]::NewGuid().ToString('N')).json"

    try {

        [System.IO.File]::WriteAllText(
            $tempBodyFile,
            $requestBody,
            [System.Text.UTF8Encoding]::new($false)
        )

        $raw = az rest `
            --method post `
            --uri $uri `
            --resource $logsEndpoint `
            --headers "Content-Type=application/json" `
            --body "@$tempBodyFile" `
            --only-show-errors `
            -o json

        Assert-EverJobsLastCommand `
            "Log Analytics REST query failed."
    }
    finally {

        if (Test-Path $tempBodyFile) {
            Remove-Item $tempBodyFile -Force
        }
    }

    if ([string]::IsNullOrWhiteSpace($raw)) {
        throw "Log Analytics returned no output."
    }

    $response = $raw | ConvertFrom-Json

    # --------------------------------------------------------
    # Convert Azure Logs Query API table response into rows
    # --------------------------------------------------------

    $rows = @()

    if (
        $response.tables -and
        @($response.tables).Count -gt 0
    ) {

        $table = @($response.tables)[0]

        $columnNames =
            @($table.columns) |
            ForEach-Object {
                $_.name
            }

        foreach ($values in @($table.rows)) {

            $row = [ordered]@{}

            for (
                $i = 0;
                $i -lt $columnNames.Count;
                $i++
            ) {
                $row[$columnNames[$i]] = $values[$i]
            }

            $rows += [pscustomobject]$row
        }
    }

    # --------------------------------------------------------
    # Validate result shape and time range
    # --------------------------------------------------------

    $badRows = @(
        $rows |
            Where-Object {

                if (
                    $_.PSObject.Properties.Name -notcontains
                    "TimeGenerated"
                ) {
                    return $true
                }

                if ([string]::IsNullOrWhiteSpace(
                    [string]$_.TimeGenerated
                )) {
                    return $true
                }

                $timestamp =
                    ([datetime]$_.TimeGenerated).
                    ToUniversalTime()

                return (
                    $timestamp -lt $FromUtc -or
                    $timestamp -gt $ToUtc
                )
            }
    )

    if ($badRows.Count -gt 0) {
        throw (
            "Log Analytics returned {0} row(s) outside the " +
            "requested time window."
        ) -f $badRows.Count
    }

    # --------------------------------------------------------
    # Determine actual returned range
    # --------------------------------------------------------

    $actualFirst = $null
    $actualLast  = $null

    if ($rows.Count -gt 0) {

        $actualFirst =
            ([datetime]$rows[0].TimeGenerated).
            ToUniversalTime()

        $actualLast =
            ([datetime]$rows[$rows.Count - 1].TimeGenerated).
            ToUniversalTime()
    }

    # --------------------------------------------------------
    # Diagnostic classification
    # --------------------------------------------------------

    $diagnosticPattern = (
        "(?i)" +
        "error|" +
        "exception|" +
        "fail(?:ed|ure)?|" +
        "warn(?:ing)?|" +
        "timeout|" +
        "timed out|" +
        "\b400\b|" +
        "\b401\b|" +
        "\b403\b|" +
        "\b404\b|" +
        "\b408\b|" +
        "\b409\b|" +
        "\b429\b|" +
        "\b500\b|" +
        "\b502\b|" +
        "\b503\b|" +
        "\b504\b|" +
        "scraper|" +
        "scrapers|" +
        "search request|" +
        "searching|" +
        "aggregat|" +
        "returning .*job|" +
        "returned .*job|" +
        "source|" +
        "batch|" +
        "health|" +
        "startup|" +
        "starting|" +
        "shutdown|" +
        "revision|" +
        "replica|" +
        "memory|" +
        "out of memory|" +
        "oom|" +
        "rate limit"
    )

    $errorPattern = (
        "(?i)" +
        "error|" +
        "exception|" +
        "fail(?:ed|ure)?|" +
        "timeout|" +
        "timed out|" +
        "\b400\b|" +
        "\b401\b|" +
        "\b403\b|" +
        "\b404\b|" +
        "\b408\b|" +
        "\b409\b|" +
        "\b429\b|" +
        "\b500\b|" +
        "\b502\b|" +
        "\b503\b|" +
        "\b504\b|" +
        "out of memory|" +
        "\boom\b"
    )

    $warningPattern = "(?i)warn(?:ing)?"

    $diagnosticRows = @(
        $rows |
            Where-Object {
                [string]$_.Log_s -match $diagnosticPattern
            }
    )

    $errorRows = @(
        $rows |
            Where-Object {
                [string]$_.Log_s -match $errorPattern
            }
    )

    $warningRows = @(
        $rows |
            Where-Object {
                [string]$_.Log_s -match $warningPattern
            }
    )

    # --------------------------------------------------------
    # Counts by app and revision
    # --------------------------------------------------------

    $rowsByApp = @(
        $rows |
            Group-Object ContainerAppName_s |
            Sort-Object Name |
            ForEach-Object {
                [pscustomobject]@{
                    app   = $_.Name
                    count = $_.Count
                }
            }
    )

    $rowsByRevision = @(
        $rows |
            Group-Object RevisionName_s |
            Sort-Object Name |
            ForEach-Object {
                [pscustomobject]@{
                    revision = $_.Name
                    count    = $_.Count
                }
            }
    )

    # --------------------------------------------------------
    # Write chronological log
    # --------------------------------------------------------

    $logFile = Join-Path $bundleDirectory "logs.txt"

    $builder = [System.Text.StringBuilder]::new()

    [void]$builder.AppendLine(
        "EverJobs Azure Container Logs"
    )

    [void]$builder.AppendLine(
        "============================"
    )

    [void]$builder.AppendLine("")
    [void]$builder.AppendLine(
        "Requested from UTC : $fromText"
    )
    [void]$builder.AppendLine(
        "Requested to UTC   : $toText"
    )
    [void]$builder.AppendLine(
        "Rows               : $($rows.Count)"
    )
    [void]$builder.AppendLine("")

    foreach ($row in $rows) {

        [void]$builder.AppendLine(
            "[$($row.TimeGenerated)] " +
            "[$($row.ContainerAppName_s)] " +
            "[$($row.RevisionName_s)]"
        )

        [void]$builder.AppendLine(
            [string]$row.Log_s
        )

        [void]$builder.AppendLine("")
    }

    [System.IO.File]::WriteAllText(
        $logFile,
        $builder.ToString(),
        $utf8
    )

    # --------------------------------------------------------
    # Write diagnostics
    # --------------------------------------------------------

    $diagnosticsFile =
        Join-Path $bundleDirectory "diagnostics.txt"

    $diagnosticsBuilder =
        [System.Text.StringBuilder]::new()

    [void]$diagnosticsBuilder.AppendLine(
        "EverJobs Diagnostic Log Extract"
    )

    [void]$diagnosticsBuilder.AppendLine(
        "=============================="
    )

    [void]$diagnosticsBuilder.AppendLine("")
    [void]$diagnosticsBuilder.AppendLine(
        "Total rows      : $($rows.Count)"
    )
    [void]$diagnosticsBuilder.AppendLine(
        "Diagnostic rows : $($diagnosticRows.Count)"
    )
    [void]$diagnosticsBuilder.AppendLine(
        "Error-like rows : $($errorRows.Count)"
    )
    [void]$diagnosticsBuilder.AppendLine(
        "Warning rows    : $($warningRows.Count)"
    )
    [void]$diagnosticsBuilder.AppendLine("")

    foreach ($row in $diagnosticRows) {

        [void]$diagnosticsBuilder.AppendLine(
            "[$($row.TimeGenerated)] " +
            "[$($row.ContainerAppName_s)] " +
            "[$($row.RevisionName_s)]"
        )

        [void]$diagnosticsBuilder.AppendLine(
            [string]$row.Log_s
        )

        [void]$diagnosticsBuilder.AppendLine("")
    }

    if ($diagnosticRows.Count -eq 0) {
        [void]$diagnosticsBuilder.AppendLine(
            "No diagnostic-pattern rows were found."
        )
    }

    [System.IO.File]::WriteAllText(
        $diagnosticsFile,
        $diagnosticsBuilder.ToString(),
        $utf8
    )

    # --------------------------------------------------------
    # Raw JSON - full mode only
    # --------------------------------------------------------

    $jsonFile = $null

    if (-not $Lightweight) {

        $jsonFile =
            Join-Path $bundleDirectory "logs.json"

        $cleanJson =
            $rows |
            ConvertTo-Json -Depth 20

        [System.IO.File]::WriteAllText(
            $jsonFile,
            $cleanJson,
            $utf8
        )
    }

    # --------------------------------------------------------
    # Manifest
    # --------------------------------------------------------

    $manifest = [ordered]@{
        generatedUtc =
            (Get-Date).
            ToUniversalTime().
            ToString("o")

        mode =
            $(if ($Lightweight) {
                "lightweight"
            }
            else {
                "full"
            })

        workspaceId = $WorkspaceId

        requestedWindow = [ordered]@{
            fromUtc = $FromUtc.ToString("o")
            toUtc   = $ToUtc.ToString("o")
        }

        actualWindow = [ordered]@{
            firstUtc =
                $(if ($actualFirst) {
                    $actualFirst.ToString("o")
                }
                else {
                    $null
                })

            lastUtc =
                $(if ($actualLast) {
                    $actualLast.ToString("o")
                }
                else {
                    $null
                })
        }

        validation = [ordered]@{
            passed         = $true
            outOfRangeRows = 0
        }

        counts = [ordered]@{
            totalRows      = $rows.Count
            diagnosticRows = $diagnosticRows.Count
            errorLikeRows  = $errorRows.Count
            warningRows    = $warningRows.Count
        }

        rowsByApp      = $rowsByApp
        rowsByRevision = $rowsByRevision

        files = [ordered]@{
            manifest    = "manifest.json"
            query       = "query.kql"
            logs        = "logs.txt"
            diagnostics = "diagnostics.txt"
            rawJson     =
                $(if ($jsonFile) {
                    "logs.json"
                }
                else {
                    $null
                })
        }
    }

    $manifestFile =
        Join-Path $bundleDirectory "manifest.json"

    [System.IO.File]::WriteAllText(
        $manifestFile,
        (
            $manifest |
            ConvertTo-Json -Depth 20
        ),
        $utf8
    )

    # --------------------------------------------------------
    # Warn on suspiciously large result
    # --------------------------------------------------------

    if ($rows.Count -gt 50000) {
        Write-Warning (
            "Log query returned {0:N0} rows. " +
            "Check that the requested time window is appropriate."
        ) -f $rows.Count
    }

    # --------------------------------------------------------
    # ZIP
    # --------------------------------------------------------

    if (-not $NoZip) {

        Compress-Archive `
            -Path (Join-Path $bundleDirectory "*") `
            -DestinationPath $zipFile `
            -Force
    }

    # --------------------------------------------------------
    # Result
    # --------------------------------------------------------

    return [pscustomobject]@{
        Count           = $rows.Count
        DiagnosticCount = $diagnosticRows.Count
        ErrorCount      = $errorRows.Count
        WarningCount    = $warningRows.Count

        Directory       = $bundleDirectory
        Zip             =
            $(if ($NoZip) {
                $null
            }
            else {
                $zipFile
            })

        Manifest        = $manifestFile
        Query           = $queryFile
        Logs            = $logFile
        Diagnostics     = $diagnosticsFile
        Json            = $jsonFile

        FromUtc         = $FromUtc
        ToUtc           = $ToUtc
        ActualFirstUtc  = $actualFirst
        ActualLastUtc   = $actualLast
    }
}