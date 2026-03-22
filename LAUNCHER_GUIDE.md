# 🚀 Автозапуск TSCode Generator

## Файлы для запуска

### `start_auto.bat` - Полная автоматическая установка и запуск

**Для первого запуска или если не уверены, что всё установлено.**

```bash
# Просто дважды кликните по файлу или запустите из командной строки
start_auto.bat
```

**Что делает:**
| Шаг | Действие |
|-----|----------|
| 1 | Проверяет наличие Python |
| 2 | Создаёт виртуальное окружение (venv) |
| 3 | Активирует venv |
| 4 | Проверяет и устанавливает зависимости Python |
| 5 | Проверяет Node.js |
| 6 | Устанавливает tsx (TypeScript executor) |
| 7 | Устанавливает frontend зависимости |
| 8 | Запускает backend (порт 8000) |
| 9 | Запускает frontend (порт 5173) |

**Время первого запуска:** ~5-10 минут (зависит от скорости интернета)  
**Время последующих запусков:** ~10 секунд

---

### `start_quick.bat` - Быстрый запуск

**Если уже есть venv и все зависимости установлены.**

```bash
start_quick.bat
```

**Что делает:**
1. Активирует существующее venv
2. Запускает backend
3. Запускает frontend

**Время запуска:** ~5 секунд

---

## После запуска

Откройте в браузере:

| Сервис | URL |
|--------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/api/health |

---

## Остановка

Для остановки серверов:
1. Закройте окно командной строки
2. Или нажмите `Ctrl+C` в окне батника

---

## Требования

### Обязательно:
- **Python 3.11+** (скачать: https://www.python.org/downloads/)
- **Node.js 18+** (скачать: https://nodejs.org/)

### Опционально (установится автоматически):
- tsx (TypeScript executor)
- npm пакеты для frontend
- Python пакеты (pandas, fastapi, langfuse, и др.)

---

## Troubleshooting

### ❌ "Python не найден"

1. Установите Python с https://www.python.org/downloads/
2. **Важно:** При установке отметьте галочку "Add Python to PATH"
3. Перезапустите командную строку

### ❌ "Node.js не найден"

1. Установите Node.js с https://nodejs.org/
2. Выберите LTS версию
3. Перезапустите командную строку

### ❌ "Ошибка доступа при создании venv"

Запустите батник от имени администратора:
1. Правый клик по `start_auto.bat`
2. "Запуск от имени администратора"

### ❌ "Backend не запускается"

Проверьте, не занят ли порт 8000:
```bash
# Windows
netstat -ano | findstr :8000

# Если занят, убейте процесс или измените порт в main.py
```

### ❌ "Frontend не запускается"

Очистите кэш npm:
```bash
cd frontend
npm cache clean --force
npm install
```

---

## Для разработчиков

### Ручной запуск без батника

```bash
# Активация venv
venv\Scripts\activate

# Backend
python -m uvicorn src.main:app --reload

# Frontend (в другом окне)
cd frontend
npm run dev
```

### Проверка зависимостей

```bash
# Python
pip list

# Node.js
npm list -g tsx typescript
```

### Обновление зависимостей

```bash
# Python
pip install -r requirements.txt --upgrade

# Frontend
cd frontend
npm update
```

---

## Логи

Батники выводят логи в консоль. Для сохранения в файл:

```bash
start_auto.bat > launch.log 2>&1
```

---

## Вопросы?

См. основную документацию:
- [INSTALL.md](INSTALL.md) - полная инструкция по установке
- [README.md](README.md) - описание проекта
- [API Docs](http://localhost:8000/docs) - документация API
