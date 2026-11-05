@echo off
title KisanClaim Vite Frontend
cd /d "%~dp0\frontend"
echo Starting KisanClaim Frontend on 0.0.0.0:5173...
call npm.cmd run dev -- --host 0.0.0.0 --port 5173
pause
