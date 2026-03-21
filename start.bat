@echo off
echo ========================================
echo  TypeScript Code Generator - Запуск
echo ========================================
echo.

REM Проверка Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python не найден! Установите Python 3.10+
    pause
    exit /b 1
)

REM Проверка Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js не найден! Установите Node.js 18+
    pause
    exit /b 1
)

echo [OK] Python и Node.js найдены
echo.

REM Создание venv если нет
if not exist "venv\" (
    echo [INFO] Создание виртуального окружения...
    python -m venv venv
)

REM Определение пути к Python
if exist "venv\bin\python.exe" (
    set VENV_PYTHON=venv\bin\python.exe
) else if exist "venv\Scripts\python.exe" (
    set VENV_PYTHON=venv\Scripts\python.exe
) else (
    echo [ERROR] Python в venv не найден!
    pause
    exit /b 1
)

REM Установка зависимостей Python
echo [INFO] Установка Python зависимостей...
%VENV_PYTHON% -m pip install -r requirements.txt -q

REM Установка зависимостей Node
echo [INFO] Установка Node.js зависимостей...
cd frontend
call npm install --silent
cd ..

echo.
echo ========================================
echo  ЗАПУСК СЕРВЕРОВ
echo ========================================
echo.
echo [INFO] Запуск бэкенда на http://localhost:8000
echo [INFO] Запуск фронтенда на http://localhost:5173
echo.
echo Нажмите Ctrl+C для остановки
echo.

REM Запуск бэкенда в фоне
start "TypeScript Generator - Backend" cmd /k "%VENV_PYTHON% src\main.py"

REM Ждем пока бэкенд запустится
timeout /t 3 /nobreak >nul

REM Запуск фронтенда
cd frontend
npm run dev

pause
