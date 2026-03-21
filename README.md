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

## 🌐 Деплой в сеть

### Автоматический деплой (CI/CD)

Проект настроен для автоматического деплоя через GitHub Actions:

**Фронтенд → GitHub Pages:**
1. Зайдите в Settings → Pages → Build and Deployment
2. В source выберите "GitHub Actions"
3. При пуше в main фронтенд автоматически соберётся и задеплоится

**Бэкенд → Render:**
1. Зарегистрируйтесь на https://render.com
2. Создайте новый Web Service
3. Подключите GitHub репозиторий
4. Используйте настройки из `render.yaml`:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
5. Добавьте переменную окружения `GIGACHAT_CREDENTIALS`

### Ручной деплой

**Фронтенд:**
```bash
cd frontend
npm run build
# Загрузите dist/ на любой хостинг
```

**Бэкенд:**
```bash
# На любом VPS или облаке
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## 🔧 Установка (локальная разработка)

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

### Быстрый запуск (Windows)

**Один скрипт для всего:**
```bash
start.bat
```

Это создаст виртуальное окружение, установит зависимости и запустит оба сервера.

### Раздельный запуск

**Терминал 1 — Бэкенд:**
```bash
run_backend.bat
```
Бэкенд запустится на `http://localhost:8000`

**Терминал 2 — Фронтенд:**
```bash
run_frontend.bat
```
Фронтенд запустится на `http://localhost:5173`

### Ручной запуск

**Бэкенд:**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python src\main.py
```

**Фронтенд:**
```bash
cd frontend
npm install
npm run dev
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
