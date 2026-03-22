# TSCode Generator

AI-сервис для генерации TypeScript-кода преобразования файлов в JSON.

## 🚀 Быстрый старт

### Установка и запуск (любой компьютер)

```bash
# Windows - просто запустите этот файл
setup_and_run.bat
```

Скрипт автоматически:
1. Найдёт Python (3.10+)
2. Создаст виртуальное окружение
3. Установит все зависимости
4. Проверит Node.js и установит frontend зависимости
5. Запустит backend (порт 8000) и frontend (порт 5173)

### Ручной запуск

```bash
# 1. Установка зависимостей Python
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 2. Установка зависимостей frontend (если есть Node.js)
cd frontend
npm install

# 3. Запуск backend
cd src
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. Запуск frontend (в другом окне)
cd frontend
npm run dev
```

## 📍 URLs

| Сервис | URL |
|--------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/api/health |
| **Token Stats** | http://localhost:8000/api/token-stats |

## 🔌 API Endpoints

### Основные

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/health` | GET | Проверка здоровья + статистика кэша |
| `/api/generate` | POST | Генерация TypeScript кода из файла |
| `/api/validate` | POST | Валидация TypeScript кода |
| `/api/generate-tests` | POST | Генерация unit-тестов |
| `/api/full-pipeline` | POST | Полный пайплайн: код + тесты + валидация |
| `/api/token-stats` | GET | Статистика использования токенов (LangFuse) |

### Пример запроса

```bash
curl -X POST http://localhost:8000/api/generate \
  -F "file=@data.csv" \
  -F "target_json={\"name\": \"string\", \"age\": \"number\"}" \
  -F "llm_provider=openrouter"
```

## 🎯 Промт для ИИ-генерации

### Формат целевой схемы

При запросе к ИИ укажите целевую JSON схему в следующем формате:

```json
{
  "result": "string",
  "data": [
    {
      "id": "number",
      "name": "string",
      "email": "string",
      "active": "boolean"
    }
  ],
  "metadata": {
    "sourceType": "string",
    "rowCount": "number",
    "processedAt": "string"
  }
}
```

### Типы данных

| Тип | Описание | Пример |
|-----|----------|--------|
| `string` | Строка | `"hello"` |
| `number` | Число | `42`, `3.14` |
| `boolean` | Булево | `true`, `false` |
| `array` | Массив | `[1, 2, 3]` |
| `object` | Объект | `{"key": "value"}` |

### Пример промта

```
Создай функцию transformData для парсинга CSV файла с сотрудниками.

Целевая схема:
{
  "employees": [
    {
      "id": "number",
      "fullName": "string",
      "email": "string",
      "department": "string",
      "salary": "number",
      "hireDate": "string"
    }
  ],
  "summary": {
    "totalEmployees": "number",
    "averageSalary": "number",
    "departments": ["string"]
  }
}

Входные данные: CSV файл с колонками id, name, email, dept, salary, hired
```

## 📊 LangFuse - Трекинг токенов

Для отслеживания использования токенов настройте LangFuse:

### 1. Регистрация

1. Зайдите на https://cloud.langfuse.com
2. Создайте аккаунт и проект
3. Получите ключи (Public Key, Secret Key)

### 2. Настройка

Добавьте в `.env`:

```env
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

### 3. Проверка

Откройте http://localhost:8000/api/token-stats

Или посмотрите виджет "Tokens" в шапке frontend.

## 🔑 Настройка .env

```env
# LLM Provider
OPENROUTER_API_KEY=sk-or-...
GIGACHAT_CREDENTIALS=client_id:client_secret
LLM_PROVIDER=auto

# LangFuse (опционально)
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com

# App
APP_URL=http://localhost:8000
```

## 📦 Поддерживаемые форматы

| Формат | Расширения |
|--------|------------|
| CSV | `.csv` |
| Excel | `.xls`, `.xlsx` |
| PDF | `.pdf` |
| Word | `.docx` |
| Изображения | `.png`, `.jpg`, `.jpeg` |

## 🛠️ Требования

- **Python**: 3.10+
- **Node.js**: 18+ (для frontend)
- **npm**: 9+

## 📝 Лицензия

Хакатон Сбер 2026
