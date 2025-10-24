# Stop all Bank Stablecoin services on Windows

Write-Host "Stopping all Bank Stablecoin services..." -ForegroundColor Yellow
Write-Host ""

# Stop Daml processes
Write-Host "Stopping Daml sandbox..."
Get-Process | Where-Object {$_.ProcessName -like "*daml*" -or $_.ProcessName -like "*canton*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Stop Node processes (CORS proxy and React dev server)
Write-Host "Stopping CORS proxy and React UI..."
Get-Process | Where-Object {$_.CommandLine -like "*cors-proxy.js*" -or $_.CommandLine -like "*react-scripts*" -or $_.CommandLine -like "*craco*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Give processes time to terminate
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "All services stopped." -ForegroundColor Green