Write-Host "Stopping any process on port 3000..." -ForegroundColor Cyan
$port = 3000
$tcpConnections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if ($tcpConnections) {
    foreach ($conn in $tcpConnections) {
        $pidToKill = $conn.OwningProcess
        if ($pidToKill) {
            Write-Host "Killing process ID $pidToKill..." -ForegroundColor Yellow
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "Old processes stopped." -ForegroundColor Green
} else {
    Write-Host "No process found on port 3000." -ForegroundColor Green
}

Write-Host "Starting fresh Next.js dev server..." -ForegroundColor Cyan
npm run dev
