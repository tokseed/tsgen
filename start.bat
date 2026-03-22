@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

echo ========================================
echo  TypeScript Code Generator - Full Start
echo ========================================
echo.

cd /d "%~dp0"

:: === CHECK DEPENDENCIES ===
echo [1/6] Checking environment...

:: Python
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Install from python.org
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo [OK] Python: %%i

:: Node.js  
where node >nul 2>&1
if errorlevel 1 (
    echo [WARN] Node.js not found!
) else (
    for /f "delims=" %%i in ('node --version 2^>^&1') do echo [OK] Node.js: %%i
)
echo.

:: === SETUP VENV ===
echo [2/6] Virtual environment...
if not exist "venv" (
    python -m venv venv
    echo [OK] venv created
) else (
    echo [OK] venv exists
)
echo.

:: Find Python in venv
if exist "venv\bin\python.exe" (
    set "VENV_PY=venv\bin\python.exe"
) else if exist "venv\Scripts\python.exe" (
    set "VENV_PY=venv\Scripts\python.exe"
) else (
    echo [ERROR] venv Python not found!
    pause
    exit /b 1
)
echo [OK] Using: !VENV_PY!
echo.

:: === INSTALL PYTHON DEPS ===
echo [3/6] Python dependencies...
!VENV_PY! -m pip install --upgrade pip -q
!VENV_PY! -m pip install -r requirements.txt -q
if errorlevel 1 (
    echo [WARN] Some packages failed, installing core...
    !VENV_PY! -m pip install fastapi uvicorn python-dotenv langfuse openai httpx pandas openpyxl pypdf python-docx pillow pytesseract -q
)
echo [OK] Python deps ready
echo.

:: === INSTALL FRONTEND DEPS ===
echo [4/6] Frontend dependencies...
if not exist "frontend\node_modules" (
    cd frontend
    call npm install
    cd ..
)
echo [OK] Frontend deps ready
echo.

:: === START BACKEND ===
echo [5/6] Starting backend on http://localhost:8000
start "TSGen Backend" cmd /k "cd /d \"%~dp0src\" && ..\\!VENV_PY! -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 4 /nobreak >nul

:: === START FRONTEND ===
echo [6/6] Starting frontend on http://localhost:5173
cd frontend
start "TSGen Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo  STARTED SUCCESSFULLY
echo ========================================
echo.
echo   Backend:   http://localhost:8000
echo   Frontend:  http://localhost:5173  
echo   API Docs:  http://localhost:8000/docs
echo.
echo Press Enter to exit (servers will keep running)
echo Or close the server windows to stop
pause
