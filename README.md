# TypeScript Code Generator

AI-powered сервис для генерации TypeScript-кода преобразования файлов в JSON с использованием GigaChat и OpenRouter AI.

## 🚀 Возможности

- **Генерация TypeScript кода** — автоматическое создание кода для преобразования файлов в JSON
- **Поддержка форматов**: CSV, Excel (.xls, .xlsx), PDF, DOCX, PNG, JPG
- **Два AI провайдера** — GigaChat (Сбер) и OpenRouter с переключением в UI
- **Валидация кода** — проверка сгенерированного кода на ошибки
- **Генерация тестов** — автоматическое создание unit-тестов для функции `transformData`
- **Минималистичный дизайн** — современный UI в цветах Сбера с анимациями
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

## 🎯 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/tokseed/tsgen.git
cd tsgen
```

### 2. Настройка бэкенда

```bash
# Установка зависимостей
pip install -r requirements.txt

# Настройка LLM провайдеров
cp .env.example .env
# Откройте .env и добавьте API ключи
```

**Настройка провайдеров:**

```bash
# Для GigaChat (Сбер):
GIGACHAT_CREDENTIALS=client_id:client_secret

# Для OpenRouter:
OPENROUTER_API_KEY=your_api_key

# Автовыбор (использовать доступный):
LLM_PROVIDER=auto
```

### 3. Настройка фронтенда

```bash
cd frontend

# Установка зависимостей
npm install
```

## ▶️ Запуск

### Быстрый запуск (Windows)

```bash
start.bat
```

### Раздельный запуск

**Терминал 1 — Бэкенд:**
```bash
python app.py
```

**Терминал 2 — Фронтенд:**
```bash
cd frontend && npm run dev
```

## 🎨 Дизайн

Проект использует современный минималистичный дизайн в цветах Сбера:
- **Основной цвет**: `#21a038` (Сбер зелёный)
- **Градиенты**: от `#21a038` до `#2ecc71`
- **Анимации**: плавные переходы, hover-эффекты, pulse-анимации
- **Логотип**: стилизованная буква "С" с элементами кода

## 📡 API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/health` | GET | Проверка здоровья сервиса |
| `/api/generate` | POST | Генерация TypeScript кода |
| `/api/validate` | POST | Валидация TypeScript кода |
| `/api/generate-and-validate` | POST | Генерация + валидация |
| `/api/generate-tests` | POST | Генерация unit-тестов |
| `/api/full-pipeline` | POST | Полный цикл: код + тесты + валидация |

Все endpoints поддерживают параметр `llm_provider` для выбора провайдера:
- `gigachat` — использовать GigaChat
- `openrouter` — использовать OpenRouter
- `auto` — автовыбор (по умолчанию)

### Пример запроса

```bash
curl -X POST http://localhost:8000/api/generate \
  -F "file=@data.csv" \
  -F "target_json={\"name\": \"string\", \"age\": \"number\"}" \
  -F "llm_provider=openrouter"
```

## 🔧 Промпт для генерации

Сервис использует детально проработанный системный промпт с чётким ТЗ:

1. **Архитектура кода** — строгие интерфейсы, точные типы
2. **Парсинг и преобразование** — устойчивый к ошибкам
3. **Обработка ошибок** — try-catch, валидация полей
4. **Качество кода** — JSDoc, best practices
5. **Формат вывода** — только код в markdown блоке

## 📁 Структура проекта

```
tsgen/
├── src/                    # Бэкенд (FastAPI)
│   ├── main.py            # API сервер
│   ├── converter.py       # Генерация TypeScript (GigaChat + OpenRouter)
│   ├── validator.py       # Валидация кода
│   ├── test_generator.py  # Генерация тестов
│   └── cli.py             # CLI утилита
├── frontend/              # Фронтенд (React + Vite)
│   ├── src/
│   │   ├── App.jsx        # Основное приложение
│   │   ├── api.js         # API клиент
│   │   ├── ProviderToggle.jsx  # Переключатель провайдеров
│   │   ├── FileUpload.jsx # Компонент загрузки
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── tests/                 # Тесты
├── requirements.txt       # Python зависимости
├── .env                   # Переменные окружения
├── .env.example           # Шаблон переменных
└── IMPROVEMENTS.md        # Предложения по улучшению
```

## 🛠️ Технологии

- **Бэкенд**: FastAPI, LangChain, GigaChat, OpenRouter
- **Фронтенд**: React 18, Vite, TailwindCSS, Framer Motion, Lucide Icons
- **Обработка файлов**: pandas, openpyxl, pypdf, python-docx, pytesseract

## 💡 Предложения по улучшению

См. файл [IMPROVEMENTS.md](IMPROVEMENTS.md) с подробным списком улучшений:

- 🔴 **Краткосрочные**: История генераций, предпросмотр данных, шаблоны схем
- 🟡 **Среднесрочные**: Мультифайловая загрузка, кастомизация промпта, live-валидация
- 🟢 **Долгосрочные**: REST API, VS Code extension, командная работа

## 📝 Лицензия

Проект создан в рамках Хакатона Сбер 2026.

## 👤 Контакты

- Telegram: [t.me/m3rcin](https://t.me/m3rcin)
- Хакатон Сбер 2026
