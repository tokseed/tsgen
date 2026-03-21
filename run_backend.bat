@echo off
echo ========================================
echo  Запуск БЭКЕНДА
echo ========================================
echo.

REM Проверка venv
if not exist "venv\" (
    echo [ERROR] Виртуальное окружение не найдено!
    echo Запустите start.bat для первоначальной настройки
    pause
    exit /b 1
)

REM Определение пути к Python (bin для Linux-style, Scripts для Windows)
if exist "venv\bin\python.exe" (
    set VENV_PYTHON=venv\bin\python.exe
) else if exist "venv\Scripts\python.exe" (
    set VENV_PYTHON=venv\Scripts\python.exe
) else (
    echo [ERROR] Python в venv не найден!
    pause
    exit /b 1
)

REM Установка зависимостей
echo [INFO] Установка зависимостей...
%VENV_PYTHON% -m pip install -r requirements.txt -q 2>nul

echo [INFO] Запуск сервера на http://localhost:8000
echo.
echo API доступно:
echo   - Health: http://localhost:8000/api/health
echo   - Generate: http://localhost:8000/api/generate
echo   - Docs: http://localhost:8000/docs
echo.
echo Нажмите Ctrl+C для остановки
echo.

%VENV_PYTHON% src\main.py
