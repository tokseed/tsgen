@echo off
chcp 65001 >nul
echo ========================================
echo   Frontend Dev Server
echo ========================================
echo.

cd /d "%~dp0frontend"

echo [INFO] Запуск Vite dev сервера...
echo.

npm run dev

pause
