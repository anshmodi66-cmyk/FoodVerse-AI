# Food Verse AI - Host Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    FOOD VERSE AI - FULL-STACK SYSTEM LAUNCHER" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot

Write-Host "Opening application in browser..." -ForegroundColor Yellow
Start-Process "http://127.0.0.1:8000"

Write-Host "Starting Unified FastAPI + React Production Server on Port 8000..." -ForegroundColor Green
Write-Host "App URL:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "(Press Ctrl+C to terminate server)" -ForegroundColor Gray

python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

