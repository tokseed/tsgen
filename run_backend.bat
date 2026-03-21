@echo off
chcp 65001 >nul
echo ========================================
echo   Backend Server - TypeScript Generator
echo ========================================
echo.

set PYTHON_PATH=%LOCALAPPDATA%\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\python.exe

if not exist "%PYTHON_PATH%" (
    echo [ERROR] Python не найден!
    pause
    exit /b 1
)

cd /d "%~dp0src"
echo [INFO] Запуск сервера на порту 8000...
echo.

"%PYTHON_PATH%" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
