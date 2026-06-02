$ErrorActionPreference = "Stop"

$port = 3000
$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if (-not $connections) {
  Write-Host "No U-Quest local server is listening on http://127.0.0.1:$port"
  exit 0
}

$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

foreach ($processId in $processIds) {
  Stop-Process -Id $processId -Force
  Write-Host "Stopped local server process: $processId"
}
