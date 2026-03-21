@echo off
echo ========================================
echo  Запуск ФРОНТЕНДА
echo ========================================
echo.

REM Проверка Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js не найден!
    pause
    exit /b 1
)

REM Проверка node_modules
if not exist "frontend\node_modules\" (
    echo [INFO] Установка зависимостей...
    cd frontend
    call npm install --silent
    cd ..
)

echo [INFO] Запуск сервера разработки...
echo.
echo Фронтенд доступен на: http://localhost:5173
echo.
echo Нажмите Ctrl+C для остановки
echo.

cd frontend
npm run dev
