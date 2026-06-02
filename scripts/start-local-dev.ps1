$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$port = 3000
$url = "http://127.0.0.1:$port"
$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

if ($existing) {
  Write-Host "U-Quest local server is already running: $url"
  Write-Host "Process ID: $($existing.OwningProcess)"
  exit 0
}

$outLog = Join-Path $root "uquest-dev.log"
$errLog = Join-Path $root "uquest-dev.err.log"

Start-Process `
  -FilePath "npm.cmd" `
  -ArgumentList @("run", "dev:local") `
  -WorkingDirectory $root `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog `
  -WindowStyle Hidden

Start-Sleep -Seconds 4

try {
  $response = Invoke-WebRequest -UseBasicParsing $url
  Write-Host "U-Quest local server started: $url"
  Write-Host "Status: $($response.StatusCode)"
} catch {
  Write-Host "Server start was requested, but it is not ready yet."
  Write-Host "Check logs:"
  Write-Host "  $outLog"
  Write-Host "  $errLog"
  exit 1
}
