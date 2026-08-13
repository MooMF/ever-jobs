$ErrorActionPreference = "Stop"

. "$PSScriptRoot\EverJobs.Common.ps1"

Write-EverJobsHeader "EverJobs Repository Update"

Set-EverJobsRepoLocation

$currentBranch = git branch --show-current
Assert-EverJobsLastCommand `
    "Unable to determine current Git branch."

Write-Host "Current branch: $currentBranch"
Write-Host ""

$status = git status --porcelain
Assert-EverJobsLastCommand `
    "Unable to determine Git status."

if ($status) {
    Write-Host "Working tree has local changes:"
    Write-Host ""

    git status --short

    Write-Host ""

    throw "Working tree is not clean. Commit or stash changes before updating."
}

Write-Host "Working tree is clean."
Write-Host ""

Write-Host "Fetching origin and upstream..."

git fetch origin --prune
Assert-EverJobsLastCommand `
    "Failed to fetch origin."

git fetch upstream --prune
Assert-EverJobsLastCommand `
    "Failed to fetch upstream."

Write-Host ""

switch ($currentBranch) {

    "develop" {
        Write-Host "Fast-forwarding develop from upstream/develop..."

        git merge --ff-only upstream/develop

        Assert-EverJobsLastCommand `
            "develop could not be fast-forwarded from upstream/develop."
    }

    "jim" {
        Write-Host "Merging upstream/develop into jim..."

        git merge upstream/develop

        Assert-EverJobsLastCommand `
            "Unable to merge upstream/develop into jim."
    }

    default {
        Write-Host "No automatic merge configured for branch '$currentBranch'."
        Write-Host "Both remotes were fetched, but this branch was not changed."
    }
}

Write-Host ""
Write-Host "Current commit:"

git log -1 --oneline

Assert-EverJobsLastCommand `
    "Unable to read Git commit."

Write-Host ""
Write-Host "Repository update complete."

if ($currentBranch -eq "jim") {
    Write-Host ""
    Write-Host "Local jim branch tracks your fork:"
    git branch -vv | Select-String "^\*"
}