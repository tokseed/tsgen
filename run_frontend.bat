@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

echo ========================================
echo  TSGen - Frontend Only
echo ========================================
echo.

cd /d "%~dp0"

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Install from https://nodejs.org/
    pause
    exit /b 1
)

for /f "delims=" %%i in ('node --version 2^>^&1') do echo [OK] Node.js: %%i

:: Install deps if needed
if not exist "frontend\node_modules" (
    echo [INFO] Installing dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo [OK] Starting frontend on http://localhost:5173
echo.
echo Make sure backend is running on http://localhost:8000
echo.
echo Press Ctrl+C to stop
echo.

cd frontend
npm run dev
