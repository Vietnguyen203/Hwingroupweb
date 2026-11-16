# Run backend (dev) on Windows PowerShell:  .\run-dev.ps1
# - UTF-8 console so Vietnamese log text displays correctly
# - JDK 21 for Gradle (default java on this machine may be older)
# - create .env from .env.example if missing
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Use JAVA_HOME only if it points to a JDK 21 (read the "release" file, no native call)
function Test-Jdk21([string]$dir) {
    if (-not $dir) { return $false }
    $release = Join-Path $dir "release"
    return (Test-Path $release) -and ((Get-Content $release -Raw) -match 'JAVA_VERSION="21')
}
if (-not (Test-Jdk21 $env:JAVA_HOME)) {
    $env:JAVA_HOME = "$HOME\.jdks\temurin-21.0.13"
    if (-not (Test-Jdk21 $env:JAVA_HOME)) { throw "JDK 21 not found. Set JAVA_HOME to a JDK 21 folder." }
}
Write-Host "JAVA_HOME = $env:JAVA_HOME"

if (-not (Test-Path .env)) { Copy-Item .env.example .env; Write-Host "Created .env from .env.example" }
.\gradlew.bat bootRun
