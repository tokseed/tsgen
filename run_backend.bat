@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

echo ========================================
echo  TSGen - Backend Only
echo ========================================
echo.

cd /d "%~dp0"

:: Find Python
if exist "venv\bin\python.exe" (
    set "VENV_PY=venv\bin\python.exe"
) else if exist "venv\Scripts\python.exe" (
    set "VENV_PY=venv\Scripts\python.exe"
) else (
    echo [ERROR] Python not found!
    pause
    exit /b 1
)

:: Check deps
!VENV_PY! -c "import fastapi" 2>nul
if errorlevel 1 (
    echo [INFO] Installing...
    !VENV_PY! -m pip install fastapi uvicorn python-dotenv langfuse openai httpx -q
)

echo.
echo [OK] Starting http://localhost:8000
echo.

:: Run from src directory
cd /d "%~dp0src"
..\!VENV_PY! -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
