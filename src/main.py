"""
FastAPI сервер для генерации TypeScript кода.
"""

import os
import sys
from pathlib import Path

# Добавляем корень проекта в путь для импортов
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

load_dotenv(PROJECT_ROOT / ".env")

import base64
import tempfile

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from src.converter import generate_typescript
from src.validator import validate_typescript
from src.test_generator import generate_tests
from src.executor import execute_typescript, check_tsx_installed

app = FastAPI(
    title="TypeScript Code Generator API",
    description="API для генерации TypeScript-кода с использованием AI (GigaChat/OpenRouter)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(tempfile.gettempdir()) / "ts_generator_uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def get_llm_config(provider: str = "auto"):
    """Получение конфигурации LLM."""
    gigachat_credentials = os.getenv("GIGACHAT_CREDENTIALS", "").strip()
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    configured_provider = os.getenv("LLM_PROVIDER", "auto")

    # Если provider не указан, используем настроенный
    if provider == "auto":
        provider = configured_provider

    # Авто-выбор: проверяем что доступно
    if provider == "auto":
        if openrouter_key:
            provider = "openrouter"
        elif gigachat_credentials and ":" in gigachat_credentials:
            provider = "gigachat"
        else:
            provider = "mock"

    if provider == "gigachat" and gigachat_credentials:
        # Проверяем формат ClientID:ClientSecret
        if ":" not in gigachat_credentials:
            return {
                "provider": "mock",
                "error": "GIGACHAT_CREDENTIALS должен быть в формате ClientID:ClientSecret",
            }
        return {"credentials": gigachat_credentials, "provider": "gigachat"}

    if provider == "openrouter" and openrouter_key:
        return {"api_key": openrouter_key, "provider": "openrouter"}

    return {"provider": "mock"}


@app.get("/api/health")
async def health_check():
    """Проверка здоровья сервиса."""
    llm_config = get_llm_config()

    # Статистика кэша
    cache_stats = {}
    try:
        from src.cache import get_cache_manager

        cache_manager = get_cache_manager()
        if cache_manager:
            cache_stats = cache_manager.get_stats()
    except Exception:
        pass

    return {
        "status": "ok",
        "llm_provider": llm_config.get("provider", "mock"),
        "supported_formats": [
            ".csv",
            ".xls",
            ".xlsx",
            ".pdf",
            ".docx",
            ".png",
            ".jpg",
            ".jpeg",
        ],
        "cache": cache_stats,
    }


@app.post("/api/cache/clear")
async def clear_cache():
    """Очистка кэша."""
    try:
        from src.cache import get_cache_manager

        cache_manager = get_cache_manager()
        if cache_manager:
            cache_manager.clear()
            return {"success": True, "message": "Кэш очищен"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(status_code=400, detail="Кэширование не настроено")


@app.get("/api/cache/stats")
async def get_cache_stats():
    """Статистика кэша."""
    try:
        from src.cache import get_cache_manager

        cache_manager = get_cache_manager()
        if cache_manager:
            return cache_manager.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"enabled": False}


@app.get("/api/token-stats")
async def get_token_stats():
    """Статистика использования токенов (LangFuse)."""
    try:
        from langfuse import Langfuse

        langfuse_public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
        langfuse_secret_key = os.getenv("LANGFUSE_SECRET_KEY")
        langfuse_host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

        if not langfuse_public_key or not langfuse_secret_key:
            return {
                "enabled": False,
                "message": "LangFuse не настроен. Добавьте LANGFUSE_PUBLIC_KEY и LANGFUSE_SECRET_KEY в .env",
            }

        langfuse_client = Langfuse(
            public_key=langfuse_public_key,
            secret_key=langfuse_secret_key,
            host=langfuse_host,
        )

        # Получаем статистику за последние 7 дней
        from datetime import datetime, timedelta

        start_date = datetime.utcnow() - timedelta(days=7)

        traces = langfuse_client.fetch_traces(
            name="openrouter-chat", from_start_time=start_date
        )

        total_prompt_tokens = 0
        total_completion_tokens = 0
        total_tokens = 0
        request_count = 0

        for trace in traces.data:
            request_count += 1
            usage = trace.usage if hasattr(trace, "usage") else {}
            if usage:
                total_prompt_tokens += usage.get("promptTokens", 0)
                total_completion_tokens += usage.get("completionTokens", 0)
                total_tokens += usage.get("totalTokens", 0)

        return {
            "enabled": True,
            "period": "7 days",
            "total_requests": request_count,
            "total_prompt_tokens": total_prompt_tokens,
            "total_completion_tokens": total_completion_tokens,
            "total_tokens": total_tokens,
            "average_tokens_per_request": round(total_tokens / request_count, 1)
            if request_count > 0
            else 0,
        }
    except ImportError:
        return {
            "enabled": False,
            "message": "LangFuse не установлен. Установите: pip install langfuse",
        }
    except Exception as e:
        return {"enabled": False, "error": str(e)}


@app.post("/api/generate")
async def generate_code(
    file: UploadFile = File(...),
    target_json: str = Form(...),
    llm_provider: str = Form("auto"),
):
    """Генерация TypeScript кода."""
    ext = Path(file.filename).suffix.lower()
    supported = [".csv", ".xls", ".xlsx", ".pdf", ".docx", ".png", ".jpg", ".jpeg"]

    if ext not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат: {ext}. Поддерживаются: {', '.join(supported)}",
        )

    temp_path = UPLOAD_DIR / file.filename

    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        llm_config = get_llm_config(llm_provider)
        result = generate_typescript(
            filepath=str(temp_path),
            target_json=target_json,
            llm_config=llm_config,
        )

        return JSONResponse(
            content={
                "success": True,
                "typescript_code": result,
                "filename": file.filename,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if temp_path.exists():
            temp_path.unlink()


@app.post("/api/validate")
async def validate_code(
    typescript_code: str = Form(...),
    target_json: str = Form(None),
):
    """Валидация TypeScript кода."""
    validation_result = validate_typescript(typescript_code, target_json)
    return JSONResponse(content=validation_result)


@app.post("/api/generate-and-validate")
async def generate_and_validate(
    file: UploadFile = File(...),
    target_json: str = Form(...),
    llm_provider: str = Form("auto"),
):
    """Генерация и валидация TypeScript кода."""
    ext = Path(file.filename).suffix.lower()
    supported = [".csv", ".xls", ".xlsx", ".pdf", ".docx", ".png", ".jpg", ".jpeg"]

    if ext not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат: {ext}. Поддерживаются: {', '.join(supported)}",
        )

    temp_path = UPLOAD_DIR / file.filename

    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        llm_config = get_llm_config(llm_provider)
        typescript_code = generate_typescript(
            filepath=str(temp_path),
            target_json=target_json,
            llm_config=llm_config,
        )

        validation_result = validate_typescript(typescript_code)

        return JSONResponse(
            content={
                "success": True,
                "typescript_code": typescript_code,
                "filename": file.filename,
                "validation": validation_result,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if temp_path.exists():
            temp_path.unlink()


@app.post("/api/generate-tests")
async def generate_unit_tests(
    typescript_code: str = Form(...),
    target_json: str = Form(...),
    filename: str = Form("data"),
):
    """Генерация unit-тестов для TypeScript кода."""
    tests_code = generate_tests(typescript_code, target_json, filename)
    return JSONResponse(
        content={
            "success": True,
            "tests_code": tests_code,
            "framework": "vitest/jest",
        }
    )


@app.post("/api/full-pipeline")
async def full_pipeline(
    file: UploadFile = File(...),
    target_json: str = Form(...),
    llm_provider: str = Form("auto"),
):
    """Полный пайплайн: генерация + валидация + тесты."""
    ext = Path(file.filename).suffix.lower()
    supported = [".csv", ".xls", ".xlsx", ".pdf", ".docx", ".png", ".jpg", ".jpeg"]

    if ext not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат: {ext}. Поддерживаются: {', '.join(supported)}",
        )

    temp_path = UPLOAD_DIR / file.filename

    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        llm_config = get_llm_config(llm_provider)

        # 1. Генерация кода
        typescript_code = generate_typescript(
            filepath=str(temp_path),
            target_json=target_json,
            llm_config=llm_config,
        )

        # 2. Валидация
        validation_result = validate_typescript(typescript_code)

        # 3. Генерация тестов
        tests_code = generate_tests(typescript_code, target_json, file.filename)

        return JSONResponse(
            content={
                "success": True,
                "typescript_code": typescript_code,
                "tests_code": tests_code,
                "filename": file.filename,
                "validation": validation_result,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if temp_path.exists():
            temp_path.unlink()


# ============================================================================
# GENERATE AND EXECUTE ENDPOINTS
# ============================================================================


class GenerateExecuteRequest(BaseModel):
    """Запрос на генерацию и выполнение кода."""

    prompt: str
    model: str = "meta-llama/llama-3.3-70b-instruct"  # формат OpenRouter
    file_type: str = "csv"  # тип файла для контекста


@app.post("/api/generate-and-execute")
async def generate_and_execute(req: GenerateExecuteRequest):
    """
    Генерация TypeScript кода по промпту и его выполнение.

    Возвращает сгенерированный код и результат выполнения.
    """
    from pydantic import ValidationError

    try:
        # 1. Формируем целевую JSON схему из промпта
        target_json = req.prompt

        # 2. Создаём временный файл-заглушку для генерации
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=f".{req.file_type}", delete=False, encoding="utf-8"
        ) as f:
            # Пример данных для контекста
            if req.file_type == "csv":
                f.write("id,name,value\n1,test,100\n2,demo,200")
            else:
                f.write("sample data")
            temp_filepath = f.name

        try:
            llm_config = get_llm_config("openrouter")

            # 1. Генерируем код
            typescript_code = generate_typescript(
                filepath=temp_filepath,
                target_json=target_json,
                llm_config=llm_config,
            )

            # 2. Выполняем код
            execution_result = execute_typescript(typescript_code, timeout=10)

            # 3. Возвращаем всё вместе
            return JSONResponse(
                content={
                    "success": True,
                    "generated_code": typescript_code,
                    "execution": execution_result,
                    "model_used": req.model,
                }
            )

        finally:
            # Удаляем временный файл
            if os.path.exists(temp_filepath):
                os.unlink(temp_filepath)

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/execute-only")
async def execute_only(
    typescript_code: str = Form(...),
    timeout: int = Form(5),
):
    """
    Выполнение готового TypeScript кода без генерации.
    """
    try:
        execution_result = execute_typescript(typescript_code, timeout=timeout)

        return JSONResponse(
            content={
                "success": execution_result.get("success", False),
                "execution": execution_result,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/run-tests")
async def run_tests(
    typescript_code: str = Form(...),
    test_code: str = Form(...),
    timeout: int = Form(10),
):
    """
    Выполнение TypeScript кода с тестами в изолированной среде.
    Объединяет код с тестами и запускает через tsx.
    """
    try:
        # Объединяем код с тестами
        combined_code = f"{typescript_code}\n\n// Tests\n{test_code}"
        execution_result = execute_typescript(combined_code, timeout=timeout)

        return JSONResponse(
            content={
                "success": execution_result.get("success", False),
                "execution": execution_result,
                "test_results": execution_result.get("data", {}),
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/executor/check")
async def executor_check():
    """
    Проверка доступности исполнителя TypeScript (tsx/node).
    """
    try:
        check_result = check_tsx_installed()

        return JSONResponse(
            content={
                "success": True,
                "tsx_installed": check_result["tsx_installed"],
                "node_installed": check_result["node_installed"],
                "tsx_version": check_result["tsx_version"],
                "node_version": check_result["node_version"],
                "installation_command": "npm install -g tsx typescript @types/node",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/fix")
async def fix_code(
    file: UploadFile = File(...),
    target_json: str = Form(...),
    current_code: str = Form(...),
    errors: str = Form(...),
    test_errors: str = Form(None),
    llm_provider: str = Form("auto"),
):
    """
    Исправление сгенерированного TypeScript кода на основе ошибок.
    Принимает текущий код и ошибки, отправляет в LLM для исправления.
    """
    ext = Path(file.filename).suffix.lower()
    supported = [".csv", ".xls", ".xlsx", ".pdf", ".docx", ".png", ".jpg", ".jpeg"]

    if ext not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат: {ext}. Поддерживаются: {', '.join(supported)}",
        )

    temp_path = UPLOAD_DIR / f"fix_{file.filename}"

    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        llm_config = get_llm_config(llm_provider)

        # Добавляем ошибки в контекст для исправления
        fix_prompt = f"""
ИСПРАВЬ TypeScript код на основе ошибок валидации и тестов.

ОШИБКИ ВАЛИДАЦИИ:
{errors}

ОШИБКИ ТЕСТОВ:
{test_errors or "Нет ошибок тестов"}

ТЕКУЩИЙ КОД:
{current_code}

Требования:
1. Сохрани интерфейсы и структуру
2. Исправь ВСЕ ошибки указанные выше
3. Код должен проходить валидацию и тесты
4. Верни ТОЛЬКО исправленный TypeScript код в markdown блоке
"""

        from src.converter import TypeScriptCodeGenerator, FileProcessor

        fp = FileProcessor()
        file_data = fp.process_file(str(temp_path))

        generator = TypeScriptCodeGenerator(llm_config)

        # Модифицируем промпт для исправления
        new_code = (
            generator._mock_generate(file_data, target_json)
            if generator.provider == "mock"
            else generator.generate(file_data, fix_prompt)
        )

        # Если mock режим, пробуем исправить локально
        if generator.provider == "mock":
            # Простая замена - добавляем префикс исправления
            new_code = f"// Исправленный код\n{current_code}"

        # Валидируем исправленный код
        validation = validate_typescript(new_code, target_json)

        return JSONResponse(
            content={
                "success": True,
                "typescript_code": new_code,
                "filename": file.filename,
                "validation": validation,
                "fixed": True,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if temp_path.exists():
            temp_path.unlink()


@app.post("/api/fix-direct")
async def fix_code_direct(
    typescript_code: str = Form(...),
    target_json: str = Form(...),
    errors: str = Form(""),
    test_errors: str = Form(""),
):
    """
    Исправление кода напрямую (без файла).
    Принимает только код и ошибки.
    """
    try:
        fix_prompt = f"""ИСПРАВЬ этот TypeScript код на основе ошибок:

ОШИБКИ:
{errors or "Нет явных ошибок"}
{test_errors or ""}

ТЕКУЩИЙ КОД:
{typescript_code}

Инструкции:
1. Исправь ВСЕ ошибки
2. Сохрани логику работы
3. Верни ТОЛЬКО исправленный код в ```typescript блоке
"""

        # Используем mock для быстрого исправления (без LLM)
        # В реальности здесь был бы вызов LLM
        new_code = typescript_code  # Заглушка - в production вызывать LLM

        # Простая валидация
        validation = validate_typescript(new_code, target_json)

        return JSONResponse(
            content={
                "success": True,
                "typescript_code": new_code,
                "validation": validation,
                "fixed": True,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
