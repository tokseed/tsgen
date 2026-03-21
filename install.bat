@echo off
chcp 65001 >nul
echo ========================================
echo   TypeScript Code Generator - Setup
echo   Хакатон Сбер 2026
echo ========================================
echo.

set PYTHON_PATH=%LOCALAPPDATA%\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\python.exe

if not exist "%PYTHON_PATH%" (
    echo [ERROR] Python не найден!
    pause
    exit /b 1
)

echo [OK] Python найден
"%PYTHON_PATH%" --version
echo.

echo [INFO] Установка зависимостей...
"%PYTHON_PATH%" -m pip install --user -r requirements.txt

if errorlevel 1 (
    echo [ERROR] Не удалось установить зависимости
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Установка завершена!
echo ========================================
echo.
echo Использование:
echo   python src/cli.py ^<файл^> ^<JSON^>
echo.
echo Пример:
echo   python src/cli.py tests/test_data.csv "{\"data\": []}"
echo.

pause
