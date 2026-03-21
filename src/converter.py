"""
TypeScript Code Generator - Core Module
"""

import os
import json
import base64
import uuid
import requests
import time
from typing import Optional, Dict, Any
from pathlib import Path

import pandas as pd

try:
    from pypdf import PdfReader
except ImportError:
    from PyPDF2 import PdfReader

from docx import Document
from PIL import Image
import pytesseract


class GigaChatAuth:
    """GigaChat API авторизация."""

    AUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
    BASE_URL = "https://gigachat.devices.sberbank.ru/api/v1"
    MODELS_URL = "https://gigachat.devices.sberbank.ru/api/v1/models"

    def __init__(self, credentials: str, scope: str = "GIGACHAT_API_PERS"):
        self.credentials = credentials
        self.scope = scope
        self.access_token = None
        self.token_expires_at = 0
        self.is_direct_token = ":" not in credentials

    def get_token(self) -> str:
        """Получение токена доступа."""
        if self.access_token and time.time() < self.token_expires_at - 60:
            return self.access_token

        if self.is_direct_token:
            self.access_token = self.credentials
            self.token_expires_at = time.time() + 1800
            return self.access_token

        try:
            credentials_b64 = base64.b64encode(self.credentials.encode()).decode()

            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "RqUID": str(uuid.uuid4()),
                "Authorization": f"Basic {credentials_b64}",
            }

            response = requests.post(
                self.AUTH_URL, headers=headers, data={"scope": self.scope},
                verify=False, timeout=30
            )
            response.raise_for_status()

            result = response.json()
            self.access_token = result["access_token"]
            self.token_expires_at = result.get("expires_at", time.time() + 1800)

            return self.access_token
        except Exception as e:
            print(f"OAuth failed, using direct token: {e}")
            self.access_token = self.credentials
            self.token_expires_at = time.time() + 1800
            return self.access_token

    def chat(self, messages: list, model: str = "GigaChat-2") -> str:
        """Отправка запроса к GigaChat."""
        token = self.get_token()

        response = requests.post(
            f"{self.BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 4000,
            },
            verify=False,
            timeout=120,
        )
        response.raise_for_status()

        result = response.json()
        if "choices" not in result or len(result["choices"]) == 0:
            raise ValueError("Пустой ответ от GigaChat")

        return result["choices"][0]["message"]["content"]

    def check_connection(self) -> dict:
        """Проверка подключения к API."""
        try:
            token = self.get_token()
            response = requests.get(
                self.MODELS_URL,
                headers={"Authorization": f"Bearer {token}"},
                verify=False,
                timeout=10
            )
            return {"status": "ok", "models": response.json()}
        except Exception as e:
            return {"status": "error", "error": str(e)}


class FileProcessor:
    """Обработчик файлов."""

    SUPPORTED_FORMATS = {
        ".csv": "csv",
        ".xls": "excel",
        ".xlsx": "excel",
        ".pdf": "pdf",
        ".docx": "docx",
        ".png": "image",
        ".jpg": "image",
        ".jpeg": "image",
    }

    @classmethod
    def get_file_type(cls, filepath: str) -> Optional[str]:
        """Определение типа файла по расширению."""
        return cls.SUPPORTED_FORMATS.get(Path(filepath).suffix.lower())

    @classmethod
    def process_file(cls, filepath: str) -> Dict[str, Any]:
        """Обработка файла."""
        file_type = cls.get_file_type(filepath)
        if not file_type:
            raise ValueError(f"Неподдерживаемый формат: {Path(filepath).suffix}")

        processors = {
            "csv": cls._process_csv,
            "excel": cls._process_excel,
            "pdf": cls._process_pdf,
            "docx": cls._process_docx,
            "image": cls._process_image,
        }

        processor = processors.get(file_type)
        if not processor:
            raise ValueError(f"Нет обработчика для: {file_type}")

        content, structure = processor(filepath)
        return {"type": file_type, "content": content, "structure": structure}

    @staticmethod
    def _process_csv(filepath: str) -> tuple:
        df = pd.read_csv(filepath, encoding="utf-8", nrows=50)
        structure = {
            "columns": list(df.columns),
            "rows_count": len(df),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        }
        return df.head(20).to_string(), structure

    @staticmethod
    def _process_excel(filepath: str) -> tuple:
        df = pd.read_excel(filepath, nrows=50)
        structure = {
            "columns": list(df.columns),
            "rows_count": len(df),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        }
        return df.head(20).to_string(), structure

    @staticmethod
    def _process_pdf(filepath: str) -> tuple:
        reader = PdfReader(filepath)
        text = "".join(page.extract_text() or "" for page in reader.pages[:10])
        structure = {"pages": len(reader.pages), "text_length": len(text)}
        return text[:5000], structure

    @staticmethod
    def _process_docx(filepath: str) -> tuple:
        doc = Document(filepath)
        text = "\n".join([p.text for p in doc.paragraphs[:100]])

        tables_data = []
        for table in doc.tables[:5]:
            tables_data.append([[cell.text for cell in row.cells] for row in table.rows])

        structure = {
            "paragraphs": len(doc.paragraphs),
            "tables": len(doc.tables),
            "text_length": len(text),
        }

        content = text
        if tables_data:
            content += "\n\n=== TABLES ===\n"
            for i, table in enumerate(tables_data):
                content += f"\nTable {i + 1}:\n"
                for row in table:
                    content += " | ".join(row) + "\n"

        return content[:5000], structure

    @staticmethod
    def _process_image(filepath: str) -> tuple:
        image = Image.open(filepath)
        text = pytesseract.image_to_string(image, lang="rus+eng")
        structure = {"size": image.size, "mode": image.mode, "text_length": len(text)}
        return text[:5000], structure


class TypeScriptCodeGenerator:
    """Генератор TypeScript кода."""

    SYSTEM_PROMPT = """Ты — старший TypeScript разработчик в Сбер. Твоя задача — создать профессиональный TypeScript код для парсинга файлов и преобразования данных в JSON.

## Входные данные:
- Тип файла: {file_type}
- Структура данных: {structure}
- Пример содержимого (первые строки):
{content}

## Требуемый формат вывода (JSON Schema):
{target_json}

## Требования к коду (СТРОГО):

### 1. Интерфейсы и типизация
- Создай строгие TypeScript интерфейсы для всех структур данных
- Используй точные типы (string, number, boolean), избегай any
- Для необязательных полей из JSON используй ? (опциональные поля)
- Экспортируй все публичные интерфейсы и функции

### 2. Функция transformData
- Сигнатура: `export async function transformData(input: string): Promise<{interface_name}>`
- Должна корректно обрабатывать входной формат ({file_type})
- Парсинг должен быть устойчивым к ошибкам (trim, проверка на пустые значения)
- Преобразование типов: строки в числа через Number(), булевы через явное сравнение
- Валидируй обязательные поля из целевой схемы

### 3. Обработка ошибок
- Оборачивай все операции в try/catch
- Выбрасывай понятные ошибки с описанием проблемы
- Обрабатывай edge cases: пустой файл, неверный формат, missing поля

### 4. Качество кода
- Без внешних библиотек (только стандартная библиотека TypeScript/JavaScript)
- JSDoc комментарии для всех экспортируемых функций (описание, @param, @returns)
- Чистый, читаемый код с понятными именами переменных
- Следуй TypeScript Best Practices

### 5. Формат вывода
- Верни ТОЛЬКО TypeScript код в markdown блоке: ```typescript ... ```
- Без объяснений, без текста до или после кода
- Код должен быть готов к использованию в production

## Пример структуры ответа:
```typescript
// Интерфейсы для типизации
export interface TargetData {{
  // поля из JSON схемы
}}

/**
 * Парсит входные данные и преобразует в формат JSON
 * @param input - содержимое файла в виде строки
 * @returns Promise с преобразованными данными
 */
export async function transformData(input: string): Promise<TargetData> {{
  // реализация
}}
```"""

    def __init__(self, llm_config: Optional[Dict[str, Any]] = None):
        self.llm_config = llm_config or {}
        self.gigachat = self._init_gigachat()

    def _init_gigachat(self):
        """Инициализация GigaChat."""
        credentials = self.llm_config.get("credentials", "")

        if not credentials:
            print("Warning: No credentials, using mock mode")
            return None

        try:
            return GigaChatAuth(credentials)
        except Exception as e:
            print(f"Warning: Failed to init GigaChat: {e}")
            return None

    def generate(self, file_data: Dict[str, Any], target_json: str) -> str:
        """Генерация TypeScript кода."""
        if not self.gigachat:
            return self._mock_generate(file_data, target_json)

        try:
            target_dict = json.loads(target_json)
            interface_name = self._infer_interface_name(target_dict)
        except json.JSONDecodeError:
            interface_name = "TargetData"

        messages = [
            {"role": "system", "content": "Ты экспертный TypeScript разработчик. Верни ТОЛЬКО код без объяснений."},
            {
                "role": "user",
                "content": self.SYSTEM_PROMPT.format(
                    file_type=file_data["type"],
                    structure=json.dumps(file_data["structure"], ensure_ascii=False),
                    content=file_data["content"][:3000],
                    target_json=target_json,
                    interface_name=interface_name,
                ),
            },
        ]

        result = self.gigachat.chat(messages)
        return self._clean_code(result)

    def _mock_generate(self, file_data: Dict[str, Any], target_json: str) -> str:
        """Генерация mock кода."""
        try:
            target_dict = json.loads(target_json)
            interface_name = self._infer_interface_name(target_dict)
            interface_def = self._generate_interface(target_dict, interface_name)
        except json.JSONDecodeError:
            interface_name = "TargetData"
            interface_def = "interface TargetData {{ [key: string]: any; }}"

        file_type = file_data.get("type", "unknown")

        return f"""// TypeScript Code (Mock Mode)
{interface_def}

async function transformData(input: string): Promise<{interface_name}> {{
  try {{
    const lines = input.trim().split('\\n');
    if (lines.length === 0) throw new Error('Пустой файл');

    const result: {interface_name} = {{
      data: [],
      metadata: {{
        sourceType: '{file_type}',
        columns: lines[0]?.split(',').map(c => c.trim()) || [],
        rowCount: Math.max(0, lines.length - 1),
        processedAt: new Date().toISOString(),
      }},
    }};

    const headers = result.metadata.columns;
    for (let i = 1; i < lines.length; i++) {{
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length !== headers.length) continue;

      const row: {{ [key: string]: string }} = {{}};
      headers.forEach((header, idx) => {{ row[header] = values[idx] || ''; }});
      result.data.push(row as any);
    }}

    return result;
  }} catch (error) {{
    throw new Error(`Ошибка: ${{error instanceof Error ? error.message : String(error)}}`);
  }}
}}

export {{ transformData }};
"""

    @staticmethod
    def _infer_interface_name(data: Dict) -> str:
        """Определение имени интерфейса."""
        return "TransformResult" if "data" in data else "TargetData"

    @staticmethod
    def _generate_interface(data: Dict, name: str, indent: int = 0) -> str:
        """Генерация TypeScript интерфейса."""
        prefix = "  " * indent
        lines = [f"{prefix}interface {name} {{"]

        for key, value in data.items():
            if isinstance(value, dict):
                nested_name = f"{name}{key.capitalize()}"
                lines.append(
                    TypeScriptCodeGenerator._generate_interface(
                        value, nested_name, indent + 1
                    )
                )
                lines.append(f"{prefix}  {key}: {nested_name};")
            elif isinstance(value, list):
                if value and isinstance(value[0], dict):
                    nested_name = f"{name}{key.capitalize()}Item"
                    lines.append(
                        TypeScriptCodeGenerator._generate_interface(
                            value[0], nested_name, indent + 1
                        )
                    )
                    lines.append(f"{prefix}  {key}: {nested_name}[];")
                else:
                    item_type = "any"
                    if value:
                        item_type = type(value[0]).__name__
                        item_type = {
                            "str": "string",
                            "int": "number",
                            "float": "number",
                            "bool": "boolean",
                        }.get(item_type, "any")
                    lines.append(f"{prefix}  {key}: {item_type}[];")
            else:
                ts_type = type(value).__name__
                ts_type = {
                    "str": "string",
                    "int": "number",
                    "float": "number",
                    "bool": "boolean",
                }.get(ts_type, "any")
                lines.append(f"{prefix}  {key}: {ts_type};")

        lines.append(f"{prefix}}}")
        return "\n".join(lines)

    @staticmethod
    def _clean_code(code: str) -> str:
        """Очистка кода от markdown."""
        code = code.strip()
        for prefix in ["```typescript", "```ts", "```"]:
            if code.startswith(prefix):
                code = code[len(prefix):]
                break
        if code.endswith("```"):
            code = code[:-3]
        return code.strip()


class ConverterAgent:
    """Конвертер файлов в TypeScript."""

    def __init__(self, llm_config: Optional[Dict[str, Any]] = None):
        self.file_processor = FileProcessor()
        self.code_generator = TypeScriptCodeGenerator(llm_config)

    def process(self, filepath: str, target_json: str) -> Dict[str, Any]:
        """Обработка файла."""
        file_data = self.file_processor.process_file(filepath)
        typescript_code = self.code_generator.generate(file_data, target_json)

        return {
            "typescript_code": typescript_code,
            "file_info": {"type": file_data["type"], "structure": file_data["structure"]},
        }


def generate_typescript(
    filepath: str, target_json: str, llm_config: Optional[Dict] = None
) -> str:
    """Генерация TypeScript кода."""
    agent = ConverterAgent(llm_config)
    return agent.process(filepath, target_json)["typescript_code"]
