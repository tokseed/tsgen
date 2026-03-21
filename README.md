# TypeScript Code Generator

AI-powered сервис для генерации TypeScript-кода преобразования файлов в JSON с использованием GigaChat AI.

## 🚀 Возможности

- **Генерация TypeScript кода** — автоматическое создание кода для преобразования файлов в JSON
- **Поддержка форматов**: CSV, Excel (.xls, .xlsx), PDF, DOCX, PNG, JPG
- **Валидация кода** — проверка сгенерированного кода на ошибки
- **Генерация тестов** — автоматическое создание unit-тестов для функции `transformData`
- **Dev Panel** — логирование всех запросов к API для отладки

## 📋 Требования

### Бэкенд
- Python 3.10 или выше
- Tesseract OCR (для обработки изображений)
  - **Windows**: [скачать установщик](https://github.com/UB-Mannheim/tesseract/wiki)
  - **Linux**: `sudo apt install tesseract-ocr`
  - **macOS**: `brew install tesseract`

### Фронтенд
- Node.js 18 или выше
- npm или yarn

## 🔧 Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/tokseed/tsgen.git
cd tsgen
```

### 2. Настройка бэкенда

```bash
# Установка зависимостей
pip install -r requirements.txt

# Настройка GigaChat credentials
# Скопируйте .env.example в .env и заполните credentials
cp .env.example .env
```

**Важно**: Файл `.env` уже содержит настроенные credentials для GigaChat. Не изменяйте его без необходимости.

### 3. Настройка фронтенда

```bash
cd frontend

# Установка зависимостей
npm install
```

## ▶️ Запуск

### Вариант 1: Раздельный запуск (рекомендуется для разработки)

**Терминал 1 — Бэкенд:**
```bash
cd tsgen
python src/main.py
```
Бэкенд запустится на `http://localhost:8000`

**Терминал 2 — Фронтенд:**
```bash
cd tsgen/frontend
npm run dev
```
Фронтенд запустится на `http://localhost:5173`

### Вариант 2: Использование batch-файлов (Windows)

```bash
# Запуск бэкенда
run_backend.bat

# Запуск фронтенда (в новом окне)
run_frontend.bat

# Или запуск всего сразу
start.bat
```

## 📡 API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/health` | GET | Проверка здоровья сервиса |
| `/api/generate` | POST | Генерация TypeScript кода |
| `/api/validate` | POST | Валидация TypeScript кода |
| `/api/generate-and-validate` | POST | Генерация + валидация |
| `/api/generate-tests` | POST | Генерация unit-тестов |
| `/api/full-pipeline` | POST | Полный цикл: код + тесты + валидация |

### Пример запроса к API

```bash
curl -X POST http://localhost:8000/api/generate \
  -F "file=@data.csv" \
  -F "target_json={\"name\": \"string\", \"age\": \"number\"}"
```

## 🔐 Настройка GigaChat

Credentials уже настроены в файле `.env`. Если нужно получить новые:

1. Перейдите на https://developers.sber.ru/
2. Создайте новое приложение
3. Получите `client_id` и `client_secret`
4. Закодируйте в base64: `client_id:client_secret`
5. Обновите `GIGACHAT_CREDENTIALS` в файле `.env`

## 🧪 Тестирование

```bash
# Запуск тестов бэкенда
pytest tests/
```

## 📁 Структура проекта

```
tsgen/
├── src/                    # Бэкенд (FastAPI)
│   ├── main.py            # API сервер
│   ├── converter.py       # Генерация TypeScript
│   ├── validator.py       # Валидация кода
│   ├── test_generator.py  # Генерация тестов
│   └── cli.py             # CLI утилита
├── frontend/              # Фронтенд (React + Vite)
│   ├── src/
│   │   ├── App.jsx        # Основное приложение
│   │   ├── api.js         # API клиент
│   │   ├── FileUpload.jsx # Компонент загрузки
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── tests/                 # Тесты
├── requirements.txt       # Python зависимости
├── .env                   # Переменные окружения (не коммитить!)
└── .env.example           # Шаблон переменных
```

## 🛠️ Технологии

- **Бэкенд**: FastAPI, LangChain, GigaChat
- **Фронтенд**: React 18, Vite, TailwindCSS, Framer Motion
- **Обработка файлов**: pandas, openpyxl, pypdf, python-docx, pytesseract

## 📝 Лицензия

Проект создан в рамках Хакатона Сбер 2026.
