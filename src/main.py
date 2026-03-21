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
    description="API для генерации TypeScript-кода с использованием GigaChat AI",
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


def get_llm_config():
    """Получение конфигурации LLM."""
    credentials = os.getenv("GIGACHAT_CREDENTIALS", "")

    if credentials:
        try:
            decoded = base64.b64decode(credentials).decode()
            return {"credentials": decoded}
        except Exception:
            return {"credentials": credentials}

    return None


@app.get("/api/health")
async def health_check():
    """Проверка здоровья сервиса."""
    llm_config = get_llm_config()
    return {
        "status": "ok",
        "llm_provider": "gigachat" if llm_config else "mock",
        "supported_formats": [".csv", ".xls", ".xlsx", ".pdf", ".docx", ".png", ".jpg", ".jpeg"],
    }


@app.post("/api/generate")
async def generate_code(file: UploadFile = File(...), target_json: str = Form(...)):
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

        llm_config = get_llm_config()
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
async def validate_code(typescript_code: str = Form(...)):
    """Валидация TypeScript кода."""
    validation_result = validate_typescript(typescript_code)
    return JSONResponse(content=validation_result)


@app.post("/api/generate-and-validate")
async def generate_and_validate(file: UploadFile = File(...), target_json: str = Form(...)):
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

        llm_config = get_llm_config()
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
async def full_pipeline(file: UploadFile = File(...), target_json: str = Form(...)):
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

        llm_config = get_llm_config()
        
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
