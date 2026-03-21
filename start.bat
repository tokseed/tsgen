@echo off
title TS Code Generator
color 0A

echo ==========================================
echo   TypeScript Code Generator - Starting
echo ==========================================
echo.

cd /d "%~dp0"

REM Create venv if not exists
if not exist "venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv venv
    venv\Scripts\pip.exe install uvicorn fastapi python-multipart requests pandas openpyxl pypdf python-docx pillow pytesseract
)

REM Start backend
echo [1/2] Starting Backend (FastAPI)...
start "Backend - TS Generator" cmd /k "cd /d "%~dp0src" && ..\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000 --host 0.0.0.0"

timeout /t 3 /nobreak >nul

REM Start frontend
echo [2/2] Starting Frontend (Vite)...
start "Frontend - TS Generator" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ==========================================
echo   Services starting...
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo.
echo   Press Ctrl+C in each window to stop
echo ==========================================
echo.

REM Open browser
timeout /t 5 /nobreak >nul
start http://localhost:5173

pause
