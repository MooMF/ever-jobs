param(
    [int]$Days = 3,

    [string]$ResourceGroup = "ever-jobs-rg",

    [string]$Environment = "ever-jobs-env",

    [string[]]$Apps = @(
        "ever-jobs-api",
        "ever-jobs-mcp"
    ),

    [string]$OutputDirectory = ""
)

$ErrorActionPreference = "Stop"

# ----------------------------------------------------------------------
# UTF-8 output
# ----------------------------------------------------------------------

[Console]::InputEncoding  = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()

$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"

# ----------------------------------------------------------------------
# Output paths
# ----------------------------------------------------------------------

# Script lives in the repository root.
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $PSScriptRoot "logs"
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$JsonFile = Join-Path $OutputDirectory "everjobs-$Timestamp.json"
$TextFile = Join-Path $OutputDirectory "everjobs-$Timestamp.txt"

# ----------------------------------------------------------------------
# Find Log Analytics workspace
# ----------------------------------------------------------------------

Write-Host "Finding Log Analytics workspace..."

$WorkspaceId = az containerapp env show `
    --name $Environment `
    --resource-group $ResourceGroup `
    --query "properties.appLogsConfiguration.logAnalyticsConfiguration.customerId" `
    -o tsv

if ([string]::IsNullOrWhiteSpace($WorkspaceId)) {
    throw "Could not determine Log Analytics workspace ID."
}

Write-Host "Workspace: $WorkspaceId"

# ----------------------------------------------------------------------
# Build application filter
# ----------------------------------------------------------------------

$QuotedApps = $Apps | ForEach-Object { "`"$_`"" }
$AppList = $QuotedApps -join ", "

# ----------------------------------------------------------------------
# Query Log Analytics
# ----------------------------------------------------------------------

$Query = @"
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(${Days}d)
| where ContainerAppName_s in ($AppList)
| project
    TimeGenerated,
    ContainerAppName_s,
    RevisionName_s,
    Log_s
| order by TimeGenerated desc
"@

Write-Host "Downloading last $Days day(s) of logs..."

$Json = az monitor log-analytics query `
    --workspace $WorkspaceId `
    --analytics-query $Query `
    -o json

if ($LASTEXITCODE -ne 0) {
    throw "Azure Log Analytics query failed."
}

if ([string]::IsNullOrWhiteSpace($Json)) {
    throw "Azure Log Analytics returned no output."
}

# Write clean JSON without mixing Azure CLI stderr into the file.
[System.IO.File]::WriteAllText(
    $JsonFile,
    $Json,
    [System.Text.UTF8Encoding]::new($false)
)

# ----------------------------------------------------------------------
# Generate human-readable text log
# ----------------------------------------------------------------------

$Rows = $Json | ConvertFrom-Json

$Builder = [System.Text.StringBuilder]::new()

[void]$Builder.AppendLine("EverJobs Azure Container Logs")
[void]$Builder.AppendLine("============================")
[void]$Builder.AppendLine("")
[void]$Builder.AppendLine("Generated : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$Builder.AppendLine("Period    : Last $Days day(s)")
[void]$Builder.AppendLine("Apps      : $($Apps -join ', ')")
[void]$Builder.AppendLine("Workspace : $WorkspaceId")
[void]$Builder.AppendLine("")

foreach ($Row in @($Rows)) {

    $Time = $Row.TimeGenerated
    $App = $Row.ContainerAppName_s
    $Revision = $Row.RevisionName_s
    $Message = $Row.Log_s

    [void]$Builder.AppendLine(
        "[$Time] [$App] [$Revision]"
    )

    [void]$Builder.AppendLine($Message)
    [void]$Builder.AppendLine("")
}

[System.IO.File]::WriteAllText(
    $TextFile,
    $Builder.ToString(),
    [System.Text.UTF8Encoding]::new($false)
)

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------

$Count = @($Rows).Count

Write-Host ""
Write-Host "EverJobs logs downloaded."
Write-Host ""
Write-Host "Rows : $Count"
Write-Host "JSON : $JsonFile"
Write-Host "Text : $TextFile"