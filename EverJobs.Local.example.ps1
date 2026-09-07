# Copy this file to EverJobs.Local.ps1 and fill in values for your machine
# and Azure deployment. EverJobs.Local.ps1 is intentionally gitignored.

# ============================================================
# Local paths
# ============================================================

# Optional. EverJobs.Common.ps1 defaults this to the repository directory.
# $EverJobsRepoPath = "C:\path\to\ever-jobs"

# Optional. Defaults to <repo>\logs.
# $EverJobsLogDirectory = "C:\path\to\ever-jobs\logs"

# ============================================================
# Azure Container Apps deployment
# ============================================================

$EverJobsResourceGroup = "<resource-group>"
$EverJobsEnvironment   = "<container-apps-environment>"
$EverJobsAcrName       = "<container-registry-name>"

$EverJobsApiApp = "<api-container-app-name>"
$EverJobsMcpApp = "<mcp-container-app-name>"

# ============================================================
# Public endpoints
# ============================================================

$EverJobsApiHealthUrl = "https://<api-host>/health"
$EverJobsMcpHealthUrl = "https://<mcp-host>/health"
$EverJobsMcpUrl       = "https://<mcp-host>/mcp"

# ============================================================
# Secrets
# ============================================================

# Add machine/deployment-specific secrets here if future PowerShell tooling
# needs them. Keep EverJobs.Local.ps1 out of Git; do not put real secrets in
# this example file.
