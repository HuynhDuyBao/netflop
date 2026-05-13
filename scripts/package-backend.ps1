param(
  [string]$Output = "netflop-backend.zip"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
$backend = Join-Path $root "backend"
$outputPath = Join-Path $root $Output

if (Test-Path $outputPath) {
  Remove-Item -LiteralPath $outputPath -Force
}

Push-Location $backend
try {
  npm.cmd install --omit=dev
  Compress-Archive -Path "package.json","package-lock.json","Procfile",".platform","src" -DestinationPath $outputPath -Force
  Write-Host "Created $outputPath"
}
finally {
  Pop-Location
}
