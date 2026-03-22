# Инструкция по установке и запуску

## 🚀 Быстрый старт (Windows)

### Вариант 1: Автоматическая установка и запуск

```bash
# Запустите start_auto.bat - он всё сделает сам
start_auto.bat
```

**Что делает скрипт:**
1. ✅ Проверяет наличие Python
2. ✅ Создаёт виртуальное окружение (venv)
3. ✅ Устанавливает все зависимости Python
4. ✅ Проверяет Node.js и устанавливает tsx
5. ✅ Устанавливает frontend зависимости
6. ✅ Запускает backend (порт 8000)
7. ✅ Запускает frontend (порт 5173)

### Вариант 2: Быстрый запуск (если всё установлено)

```bash
# Если уже есть venv и зависимости
start_quick.bat
```

---

## Ручная установка

### 1. Установка зависимостей Python

```bash
# Для Windows (Python 3.11 из Microsoft Store)
py -3.11 -m pip install -r requirements.txt

# Или для вашей версии Python
python -m pip install -r requirements.txt
```

### 2. Установка Node.js зависимостей

```bash
# Установка tsx для выполнения TypeScript кода
npm install -g tsx typescript @types/node

# Установка frontend зависимостей
cd frontend
npm install
```

### 3. Настройка переменных окружения

```bash
# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env и добавьте ваши API ключи
```

### 4. Запуск сервера

```bash
# Backend (порт 8000)
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (порт 5173)
cd frontend
npm run dev
```

---

## API Endpoints

### Основные endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/health` | GET | Проверка здоровья сервиса |
| `/api/generate` | POST | Генерация TypeScript кода из файла |
| `/api/validate` | POST | Валидация TypeScript кода |
| `/api/generate-tests` | POST | Генерация unit-тестов |
| `/api/full-pipeline` | POST | Полный пайплайн: генерация + валидация + тесты |

### Новые endpoints (Generate & Execute)

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/generate-and-execute` | POST | Генерация кода по промпту + выполнение |
| `/api/execute-only` | POST | Выполнение готового TypeScript кода |
| `/api/executor/check` | GET | Проверка доступности tsx/node |

---

## Примеры использования

### 1. Генерация и выполнение кода

```bash
curl -X POST http://localhost:8000/api/generate-and-execute \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "{\"result\": \"string\", \"value\": \"number\"}",
    "model": "meta-llama/llama-3.3-70b-instruct",
    "file_type": "csv"
  }'
```

**Ответ:**
```json
{
  "success": true,
  "generated_code": "export interface TargetData { ... }",
  "execution": {
    "success": true,
    "data": { "result": "ok", "value": 42 },
    "error": null
  }
}
```

### 2. Проверка исполнителя

```bash
curl http://localhost:8000/api/executor/check
```

**Ответ:**
```json
{
  "success": true,
  "tsx_installed": true,
  "node_installed": true,
  "tsx_version": "v4.19.0",
  "node_version": "v20.11.0"
}
```

---

## LangFuse Интеграция

Для включения трекинга запросов в LangFuse:

1. Зарегистрируйтесь на https://cloud.langfuse.com
2. Создайте проект и получите ключи
3. Добавьте в `.env`:

```env
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

После этого все запросы к OpenRouter будут автоматически логироваться с метриками:
- `usage.promptTokens` — количество входных токенов
- `usage.completionTokens` — количество выходных токенов
- `usage.totalTokens` — общее количество токенов
- `duration` — время выполнения запроса

---

## Структура проекта

```
TSCode/
├── .env.example          # Шаблон переменных окружения
├── requirements.txt      # Python зависимости
├── src/
│   ├── main.py           # FastAPI приложение
│   ├── converter.py      # Генерация кода (GigaChat/OpenRouter)
│   ├── executor.py       # Выполнение TypeScript кода
│   ├── validator.py      # Валидация кода
│   ├── test_generator.py # Генерация тестов
│   └── cache.py          # Кэширование результатов
└── frontend/             # React приложение
```

---

## Troubleshooting

### Ошибка: "tsx не найден"

```bash
npm install -g tsx typescript @types/node
```

### Ошибка: "No module named 'pandas'"

```bash
# Проверьте версию Python
python --version

# Установите зависимости для вашей версии
python -m pip install -r requirements.txt
```

### Ошибка: "LANGFUSE_PUBLIC_KEY not set"

LangFuse опционален. Если ключи не указаны, трекинг просто не будет работать.

---

## Тестирование

### Проверка импортов

```bash
cd src
python -c "from converter import generate_typescript; print('OK')"
python -c "from executor import execute_typescript; print('OK')"
```

### Проверка синтаксиса

```bash
python -m py_compile src/main.py src/converter.py src/executor.py
```

### Тестовый запрос

```bash
curl http://localhost:8000/api/health
```
