@echo off
title KisanClaim Demo Launcher
cd /d "%~dp0"
echo ========================================================
echo   STARTING KISANCLAIM DUAL-LAPTOP DEMO SYSTEM
echo ========================================================
echo.

start "KisanClaim Backend (Port 8000)" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

start "KisanClaim Frontend (Port 8001)" cmd /k "cd /d %~dp0\frontend && call npm.cmd run dev"
timeout /t 4 /nobreak >nul

echo Opening Farmer Dashboard on Laptop 1...
start http://localhost:8001/?role=farmer

echo.
echo ========================================================
echo   DEMO LINKS READY:
echo.
echo   LAPTOP 1 (Farmer Dashboard):
echo   http://localhost:8001/?role=farmer
echo.
echo   LAPTOP 2 (Insurance Dashboard):
echo   http://localhost:8001/?role=insurance
echo ========================================================
pause
