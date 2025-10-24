# Bank Stablecoin Platform Startup Script for Windows

Write-Host "========================================" -ForegroundColor Blue
Write-Host "Bank Stablecoin Platform Startup" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Step 1: Clean previous build
Write-Host "[1/7] Cleaning previous build..." -ForegroundColor Blue
daml clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to clean. Exiting." -ForegroundColor Red
    exit 1
}

# Step 2: Build Daml contracts
Write-Host "[2/7] Building Daml contracts..." -ForegroundColor Blue
daml build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Daml contracts. Exiting." -ForegroundColor Red
    exit 1
}

# Step 3: Start Daml sandbox in background
Write-Host "[3/7] Starting Daml sandbox..." -ForegroundColor Blue
Start-Process -FilePath "daml" -ArgumentList "start" -NoNewWindow

# Wait for sandbox to be ready
Write-Host "Waiting for Canton sandbox to be ready..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:7575/v1/query" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 400) {
            Write-Host "✓ Daml sandbox is ready!" -ForegroundColor Green
            $ready = $true
            break
        }
    } catch {
        # Continue waiting
    }
    $attempt++
    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline
}
Write-Host ""

if (-not $ready) {
    Write-Host "Timeout waiting for Daml sandbox. Exiting." -ForegroundColor Red
    exit 1
}

# Step 4: Wait for initialization script to complete
Start-Sleep -Seconds 5

# Step 5: Fetch and update party IDs
Write-Host "[4/7] Fetching party IDs and updating configuration..." -ForegroundColor Blue
node update-parties.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to update party IDs. Exiting." -ForegroundColor Red
    exit 1
}

# Step 6: Start CORS proxy in background
Write-Host "[5/7] Starting CORS proxy..." -ForegroundColor Blue
Start-Process -FilePath "node" -ArgumentList "cors-proxy.js" -NoNewWindow

# Wait for proxy to be ready
Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://localhost:7576/v1/query" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✓ CORS proxy is ready!" -ForegroundColor Green
} catch {
    Write-Host "Warning: CORS proxy may not be ready yet" -ForegroundColor Yellow
}

# Step 7: Start React UI
Write-Host "[6/7] Starting React UI..." -ForegroundColor Blue
Set-Location ui
Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Blue
Write-Host "  • Daml Sandbox: http://localhost:6865"
Write-Host "  • JSON API: http://localhost:7575"
Write-Host "  • CORS Proxy: http://localhost:7576"
Write-Host "  • React UI: http://localhost:3001"
Write-Host "  • Navigator: http://localhost:7500"
Write-Host ""
Write-Host "Run './stop.ps1' to stop all services" -ForegroundColor Yellow
Write-Host ""

# Keep script running
Write-Host "Press any key to stop all services..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup
Write-Host "Shutting down services..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*daml*" -or $_.ProcessName -like "*node*"} | Stop-Process -Force