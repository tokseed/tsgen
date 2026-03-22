@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ╔════════════════════════════════════════════════════════════╗
echo ║        TSCode Generator - Setup and Run                    ║
echo ║     Установка и запуск проекта (любой компьютер)           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: === ШАГ 1: Проверка Python 3.11 ===
echo [1/8] Проверка Python 3.11...
set "PYTHON_EXE=C:\Users\povel\AppData\Local\Programs\Python\Python311\python.exe"

if not exist "%PYTHON_EXE%" (
    echo ❌ Python 3.11 не найден в стандартном расположении!
    echo.
    echo Попытка найти Python 3.11 в системе...
    for /f "delims=" %%p in ('where python3.11 2^>nul') do (
        set "PYTHON_EXE=%%p"
        goto :found
    )
    :found
    if not defined PYTHON_EXE (
        echo.
        echo ❌ Python 3.11 не найден!
        echo.
        echo Установите Python 3.11 с https://www.python.org/downloads/release/python-3110/
        echo Отметьте "Add Python to PATH" при установке
        pause
        exit /b 1
    )
)

for /f "tokens=2" %%i in ('"!PYTHON_EXE!" --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✅ Python 3.11 найден: !PYTHON_VERSION!
echo.

:: === ШАГ 2: Создание venv ===
echo [2/8] Создание виртуального окружения...
if exist "venv" (
    echo 📦 Удаление старого venv...
    rmdir /s /q venv 2>nul
)

"!PYTHON_EXE!" -m venv venv
if !errorlevel! neq 0 (
    echo ❌ Ошибка создания venv!
    pause
    exit /b 1
)
echo ✅ venv создано
echo.

:: === ШАГ 3: Определение пути к Python в venv ===
if exist "venv\Scripts\python.exe" (
    set "VENV_PYTHON=venv\Scripts\python.exe"
) else if exist "venv\bin\python.exe" (
    set "VENV_PYTHON=venv\bin\python.exe"
) else (
    echo ❌ Python в venv не найден!
    pause
    exit /b 1
)
echo ✅ VENV_PYTHON: !VENV_PYTHON!
echo.

:: === ШАГ 4: Обновление pip ===
echo [3/8] Обновление pip...
!VENV_PYTHON! -m pip install --upgrade pip -q
echo ✅ pip обновлён
echo.

:: === ШАГ 5: Установка зависимостей Python ===
echo [4/8] Установка зависимостей Python...
echo Это может занять 2-5 минут...
echo.
!VENV_PYTHON! -m pip install -r requirements.txt
if !errorlevel! neq 0 (
    echo.
    echo ⚠️  Некоторые пакеты не установились
    echo Попробуйте установить вручную:
    echo   !VENV_PYTHON! -m pip install fastapi uvicorn python-multipart openai langfuse
    echo.
    set /p "CONTINUE=Продолжить? (y/n): "
    if /i not "!CONTINUE!"=="y" (
        pause
        exit /b 1
    )
)
echo ✅ Зависимости Python установлены
echo.

:: === ШАГ 6: Проверка Node.js ===
echo [5/8] Проверка Node.js...
set "RUN_FRONTEND=false"
where node >nul 2>&1
if !errorlevel! equ 0 (
    for /f "delims=" %%i in ('node --version 2^>^&1') do set "NODE_VERSION=%%i"
    echo ✅ Node.js найден: !NODE_VERSION!
    set "RUN_FRONTEND=true"
) else (
    echo ⚠️  Node.js не найден
    echo Frontend не будет запущен
    echo Установите Node.js с https://nodejs.org/ для запуска frontend
)
echo.

:: === ШАГ 7: Установка frontend зависимостей ===
if "!RUN_FRONTEND!"=="true" (
    echo [6/8] Установка frontend зависимостей...
    if not exist "frontend\node_modules" (
        cd frontend
        call npm install
        if !errorlevel! neq 0 (
            cd ..
            echo ⚠️  Ошибка установки frontend зависимостей
            set "RUN_FRONTEND=false"
        ) else (
            echo ✅ Frontend зависимости установлены
        )
        cd ..
    ) else (
        echo ✅ Frontend зависимости уже установлены
    )
    echo.
)

:: === ШАГ 8: Проверка tsx ===
if "!RUN_FRONTEND!"=="true" (
    echo [7/8] Проверка tsx...
    where tsx >nul 2>&1
    if !errorlevel! neq 0 (
        echo 📦 Установка tsx...
        npm install -g tsx typescript @types/node -q
        echo ✅ tsx установлен
    ) else (
        echo ✅ tsx найден
    )
    echo.
)

:: === ШАГ 9: Запуск серверов ===
echo ╔════════════════════════════════════════════════════════════╗
echo ║                   ЗАПУСК СЕРВЕРОВ                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📍 Backend:  http://localhost:8000
echo 📍 Frontend: http://localhost:5173
echo 📍 API Docs: http://localhost:8000/docs
echo.
echo Нажмите Ctrl+C для остановки
echo.

:: Запуск backend
echo 🚀 Запуск backend...
cd src
start /B cmd /k "!VENV_PYTHON! -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
cd ..
timeout /t 5 /nobreak >nul

:: Проверка backend
echo ⏳ Проверка запуска backend...
set /a "ATTEMPT=0"
:wait_backend
!VENV_PYTHON! -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" 2>nul
if !errorlevel! equ 0 goto backend_ok
set /a "ATTEMPT+=1"
if !ATTEMPT! LSS 5 (
    timeout /t 2 /nobreak >nul
    goto wait_backend
)

echo ❌ Backend не запустился!
echo Проверьте логи в окне терминала
pause
exit /b 1

:backend_ok
echo ✅ Backend запущен
echo.

:: Запуск frontend
if "!RUN_FRONTEND!"=="true" (
    echo 🚀 Запуск frontend...
    cd frontend
    start /B cmd /k "npm run dev"
    cd ..
    timeout /t 3 /nobreak >nul
    echo ✅ Frontend запущен
    echo.
)

echo ╔════════════════════════════════════════════════════════════╗
echo ║                   ВСЁ ЗАПУЩЕНО! 🎉                         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📍 Backend:  http://localhost:8000
echo 📍 Frontend: http://localhost:5173
echo 📍 API Docs: http://localhost:8000/docs
echo.
echo Для остановки закройте это окно
echo.

:loop
timeout /t 5 /nobreak >nul
goto loop
