"""
FastAPI сервер для генерации TypeScript кода.
"""

import os
import base64
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from converter import generate_typescript
from validator import validate_typescript
from test_generator import generate_tests
from dotenv import load_dotenv

load_dotenv()

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
    gigachat_credentials = os.getenv("GIGACHAT_CREDENTIALS", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
    configured_provider = os.getenv("LLM_PROVIDER", "auto")

    # Если provider не указан, используем настроенный
    if provider == "auto":
        provider = configured_provider

    # Авто-выбор: проверяем что доступно
    if provider == "auto":
        if openrouter_key:
            provider = "openrouter"
        elif gigachat_credentials:
            provider = "gigachat"
        else:
            provider = "mock"

    if provider == "gigachat" and gigachat_credentials:
        try:
            decoded = base64.b64decode(gigachat_credentials).decode()
            return {"credentials": decoded, "provider": "gigachat"}
        except Exception:
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
        from cache import get_cache_manager
        cache_manager = get_cache_manager()
        if cache_manager:
            cache_stats = cache_manager.get_stats()
    except Exception:
        pass
    
    return {
        "status": "ok",
        "llm_provider": llm_config.get("provider", "mock"),
        "supported_formats": [".csv", ".xls", ".xlsx", ".pdf", ".docx", ".png", ".jpg", ".jpeg"],
        "cache": cache_stats,
    }


@app.post("/api/cache/clear")
async def clear_cache():
    """Очистка кэша."""
    try:
        from cache import get_cache_manager
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
        from cache import get_cache_manager
        cache_manager = get_cache_manager()
        if cache_manager:
            return cache_manager.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"enabled": False}


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

        return JSONResponse(content={"success": True, "typescript_code": result, "filename": file.filename})

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

        return JSONResponse(content={
            "success": True,
            "typescript_code": typescript_code,
            "filename": file.filename,
            "validation": validation_result,
        })

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
    return JSONResponse(content={
        "success": True,
        "tests_code": tests_code,
        "framework": "vitest/jest",
    })


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

        return JSONResponse(content={
            "success": True,
            "typescript_code": typescript_code,
            "tests_code": tests_code,
            "filename": file.filename,
            "validation": validation_result,
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if temp_path.exists():
            temp_path.unlink()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
