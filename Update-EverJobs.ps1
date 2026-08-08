$ErrorActionPreference = "Stop"

$RepoPath = "C:\repos\EverJobs\ever-jobs"

Set-Location $RepoPath

Write-Host "=== EverJobs Repository Update ==="

Write-Host "Current branch:"
git branch --show-current

Write-Host ""
Write-Host "Checking local status..."
git status --short

Write-Host ""
Write-Host "Fetching remote..."
git fetch --prune

Write-Host ""
Write-Host "Pulling latest version..."
git pull --ff-only

Write-Host ""
Write-Host "Current commit:"
git log -1 --oneline

Write-Host ""
Write-Host "EverJobs repository is up to date."