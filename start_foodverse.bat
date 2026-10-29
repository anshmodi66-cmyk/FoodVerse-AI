@echo off
title Food Verse AI - System Runner
color 0A
echo ===================================================
echo     FOOD VERSE AI - MULTIMODAL INTELLIGENCE AGENT
echo ===================================================
echo.
echo [1/4] Navigating to project directory...
cd /d "%~dp0"

echo [2/4] Starting Vite Frontend Dev Server (Port 5173)...
start "Food Verse AI - Vite" /min npm --prefix frontend run dev -- --host 0.0.0.0 --port 5173

echo [3/4] Launching Browser Window...
start "" http://localhost:5173

echo [4/4] Starting FastAPI Unified Server (Port 8000)...
echo.
echo ===================================================
echo   Vite Frontend:  http://localhost:5173
echo   Unified App:    http://localhost:8000
echo   API Docs:       http://localhost:8000/docs
echo ===================================================
echo.
echo (Press Ctrl+C to stop the server anytime)
echo.
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
