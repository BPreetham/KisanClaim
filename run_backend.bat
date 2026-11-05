@echo off
title KisanClaim FastAPI Backend
cd /d "%~dp0"
echo Starting KisanClaim Backend on 0.0.0.0:8000...
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
pause
