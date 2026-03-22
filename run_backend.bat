@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

echo ========================================
echo  TSGen - Backend Only
echo ========================================
echo.

cd /d "%~dp0"

:: Check venv
if not exist "venv" (
    echo [ERROR] venv not found! Run start.bat first
    pause
    exit /b 1
)

:: Find Python
if exist "venv\bin\python.exe" (
    set "VENV_PY=venv\bin\python.exe"
) else if exist "venv\Scripts\python.exe" (
    set "VENV_PY=venv\Scripts\python.exe"
) else (
    echo [ERROR] venv Python not found!
    pause
    exit /b 1
)

:: Install deps if needed
!VENV_PY! -c "import fastapi" 2>nul
if errorlevel 1 (
    echo [INFO] Installing dependencies...
    !VENV_PY! -m pip install -r requirements.txt -q
)

echo [OK] Starting backend on http://localhost:8000
echo.
echo API Endpoints:
echo   - http://localhost:8000/api/health
echo   - http://localhost:8000/api/generate
echo   - http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop
echo.

!VENV_PY! -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
