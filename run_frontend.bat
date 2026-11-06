@echo off
title KisanClaim Vite Frontend
cd /d "%~dp0\frontend"
echo Starting KisanClaim Frontend on port 8001...
call npm.cmd run dev
pause
