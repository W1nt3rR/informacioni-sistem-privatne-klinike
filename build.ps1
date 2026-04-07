# PrivateClinic — Build & Deploy Script
# Run from the repository root: .\build.ps1

param(
    [string]$OutputDir = ".\publish"
)

$ErrorActionPreference = "Stop"

Write-Host "=== 1/4  Cleaning previous build ===" -ForegroundColor Cyan
if (Test-Path $OutputDir) { Remove-Item $OutputDir -Recurse -Force }

Write-Host "=== 2/4  Building Angular client (production) ===" -ForegroundColor Cyan
Push-Location client
npm ci
npx ng build --configuration production
Pop-Location

Write-Host "=== 3/4  Publishing .NET API (Release) ===" -ForegroundColor Cyan
dotnet publish server/PrivateClinic.API.csproj `
    -c Release `
    -o $OutputDir `
    --self-contained false

Write-Host "=== 4/4  Copying Angular output into wwwroot ===" -ForegroundColor Cyan
$angularDist = "client\dist\client\browser"
$wwwroot = "$OutputDir\wwwroot"
if (!(Test-Path $wwwroot)) { New-Item $wwwroot -ItemType Directory | Out-Null }
Copy-Item "$angularDist\*" $wwwroot -Recurse -Force

Write-Host ""
Write-Host "Build complete! Output in: $OutputDir" -ForegroundColor Green
Write-Host "Run with:  cd $OutputDir && dotnet PrivateClinic.API.dll --environment Production"
