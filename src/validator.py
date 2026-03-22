"""
TypeScript Code Validator.
Расширенная валидация сгенерированного TypeScript кода.
"""

import re
import subprocess
import tempfile
from typing import Dict, Any, Optional, List
from pathlib import Path


class TypeScriptValidator:
    """Валидатор TypeScript кода."""

    def __init__(self):
        self.ts_config = """{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "noImplicitAny": true,
    "strictNullChecks": true
  },
  "include": ["*.ts"]
}
"""

    def validate(self, code: str, target_json: str = None) -> Dict[str, Any]:
        """
        Расширенная валидация TypeScript кода.

        Args:
            code: TypeScript код для проверки
            target_json: Целевая JSON схема для проверки соответствия

        Returns:
            Dict с результатами:
            - valid: bool (валиден ли код)
            - errors: list (список ошибок)
            - warnings: list (список предупреждений)
            - info: list (информация)
            - metrics: dict (метрики кода)
        """
        errors = []
        warnings = []
        info = []
        metrics = {}

        # Базовая проверка синтаксиса
        syntax_result = self._check_basic_syntax(code)
        errors.extend(syntax_result["errors"])
        warnings.extend(syntax_result["warnings"])
        info.extend(syntax_result["info"])

        if not syntax_result["valid"]:
            return {
                "valid": False,
                "errors": errors,
                "warnings": warnings,
                "info": info,
                "metrics": metrics,
            }

        # Проверка структуры кода
        structure_result = self._check_code_structure(code)
        errors.extend(structure_result["errors"])
        warnings.extend(structure_result["warnings"])
        info.extend(structure_result["info"])
        metrics.update(structure_result["metrics"])

        # Проверка соответствия JSON схеме
        if target_json:
            schema_result = self._check_schema_compliance(code, target_json)
            errors.extend(schema_result["errors"])
            warnings.extend(schema_result["warnings"])

        # Проверка через tsc (если доступен)
        tsc_result = self._check_with_tsc(code)
        errors.extend(tsc_result["errors"])
        warnings.extend(tsc_result["warnings"])

        # Проверка best practices
        best_practices_result = self._check_best_practices(code)
        warnings.extend(best_practices_result["warnings"])
        info.extend(best_practices_result["info"])

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "info": info,
            "metrics": metrics,
        }

    def _check_basic_syntax(self, code: str) -> Dict[str, Any]:
        """Базовая проверка синтаксиса."""
        errors = []
        warnings = []
        info = []

        # Проверка на пустой код
        if not code or not code.strip():
            return {"valid": False, "errors": ["Пустой код"], "warnings": [], "info": []}

        # Проверка парных скобок
        brackets = {"{": "}", "(": ")", "[": "]"}
        stack = []
        in_string = False
        string_char = None
        in_template = False
        in_comment = False
        prev_char = ""

        for i, char in enumerate(code):
            # Пропуск комментариев
            if prev_char == "/" and char == "/":
                in_comment = True
            if char == "\n":
                in_comment = False

            if not in_comment and not in_string:
                if char in '"\'`':
                    in_string = True
                    string_char = char
                    if char == "`":
                        in_template = True
            elif in_string and char == string_char and prev_char != "\\":
                in_string = False
                string_char = None
                if in_template:
                    in_template = False

            if not in_string and not in_comment:
                if char in brackets:
                    stack.append(char)
                elif char in brackets.values():
                    if not stack:
                        errors.append(f"Лишняя закрывающая скобка '{char}' на позиции {i}")
                    else:
                        expected = brackets[stack.pop()]
                        if char != expected:
                            errors.append(f"Несбалансированные скобки: ожидалось '{expected}', получено '{char}'")

            prev_char = char

        if stack:
            unclosed = ", ".join([f"'{b}'" for b in stack])
            errors.append(f"Не закрыты скобки: {unclosed}")

        # Проверка наличия export function transformData
        if not re.search(r"export\s+(?:async\s+)?function\s+transformData", code):
            errors.append("Отсутствует экспортируемая функция transformData")

        # Проверка наличия интерфейсов
        if "interface" not in code and "type " not in code:
            warnings.append("Рекомендуется добавить TypeScript интерфейсы или типы для типизации")

        # Проверка на наличие markdown остатков
        if "```" in code:
            errors.append("Код содержит markdown-блоки (```). Возможно, ответ LLM не был очищен.")

        info.append("Базовый синтаксис проверен")

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings, "info": info}

    def _check_code_structure(self, code: str) -> Dict[str, Any]:
        """Проверка структуры кода."""
        errors = []
        warnings = []
        info = []
        metrics = {}

        # Подсчёт функций
        functions = re.findall(r"(?:export\s+)?(?:async\s+)?function\s+(\w+)", code)
        metrics["functions"] = functions
        metrics["function_count"] = len(functions)

        # Подсчёт интерфейсов
        interfaces = re.findall(r"(?:export\s+)?interface\s+(\w+)", code)
        metrics["interfaces"] = interfaces
        metrics["interface_count"] = len(interfaces)

        # Проверка наличия transformData
        if "transformData" not in functions:
            errors.append("Функция transformData не найдена")

        # Проверка наличия async/await
        has_async = "async" in code
        has_await = "await" in code
        if has_async and not has_await:
            info.append("Функция объявлена как async, но не использует await (возможно, для единообразия)")

        # Проверка наличия try/catch
        has_try = "try" in code
        has_catch = "catch" in code or "Error" in code
        if not has_try and not has_catch:
            warnings.append("Отсутствует обработка ошибок (try/catch)")

        # Проверка на использование any
        any_matches = re.findall(r":\s*any\b", code)
        if any_matches:
            warnings.append(f"Используется тип 'any' ({len(any_matches)} раз) — рекомендуется использовать строгие типы")

        # Проверка наличия JSDoc
        has_jsdoc = "/**" in code and "* @" in code
        if not has_jsdoc and "export" in code:
            warnings.append("Отсутствуют JSDoc комментарии для экспортируемых функций")

        # Проверка импортов
        imports = re.findall(r"import\s+.*?from\s+['\"](.*?)['\"]", code)
        if imports:
            external_imports = [imp for imp in imports if not imp.startswith(".")]
            if external_imports:
                warnings.append(f"Используются внешние зависимости: {', '.join(set(external_imports))}. Требуется только стандартная библиотека.")

        # Проверка на наличие console.log (отладка)
        if "console.log" in code:
            info.append("Обнаружен console.log — возможно, отладочный код")

        metrics["lines"] = len(code.split("\n"))
        metrics["characters"] = len(code)

        info.append(f"Найдено функций: {len(functions)}, интерфейсов: {len(interfaces)}")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "info": info,
            "metrics": metrics,
        }

    def _check_schema_compliance(self, code: str, target_json: str) -> Dict[str, Any]:
        """Проверка соответствия кода целевой JSON схеме."""
        errors = []
        warnings = []

        try:
            import json
            target_dict = json.loads(target_json)

            # Извлечение имён полей из целевой схемы
            target_fields = set(target_dict.keys())

            # Проверка наличия полей в коде
            for field in target_fields:
                if field not in code:
                    warnings.append(f"Поле '{field}' из целевой схемы не найдено в коде")

            # Проверка наличия Promise
            if "Promise" not in code:
                errors.append("Функция transformData должна возвращать Promise")

            # Проверка наличия интерфейса с нужным именем
            interface_match = re.search(r"interface\s+(\w+)", code)
            if not interface_match:
                warnings.append("Не найден интерфейс для типизации результата")

        except json.JSONDecodeError:
            warnings.append("Не удалось распарсить целевую JSON схему")
        except Exception as e:
            warnings.append(f"Ошибка проверки схемы: {str(e)}")

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}

    def _check_with_tsc(self, code: str) -> Dict[str, Any]:
        """Проверка через TypeScript compiler."""
        errors = []
        warnings = []

        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                ts_file = Path(tmpdir) / "code.ts"
                ts_file.write_text(code, encoding="utf-8")

                config_file = Path(tmpdir) / "tsconfig.json"
                config_file.write_text(self.ts_config, encoding="utf-8")

                result = subprocess.run(
                    ["tsc", "--noEmit", "--pretty", "false"],
                    cwd=tmpdir,
                    capture_output=True,
                    text=True,
                    timeout=30,
                )

                if result.returncode != 0:
                    output = result.stderr + result.stdout
                    error_lines = [line.strip() for line in output.split("\n") if "error TS" in line]
                    for line in error_lines[:10]:  # Максимум 10 ошибок
                        errors.append(f"TS Error: {line}")

        except FileNotFoundError:
            pass  # tsc не установлен — пропускаем
        except subprocess.TimeoutExpired:
            warnings.append("Превышено время проверки TypeScript compiler")
        except Exception as e:
            warnings.append(f"Ошибка при проверке tsc: {str(e)}")

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}

    def _check_best_practices(self, code: str) -> Dict[str, Any]:
        """Проверка best practices."""
        warnings = []
        info = []

        # Проверка на использование var
        if re.search(r"\bvar\b", code):
            warnings.append("Используется 'var' — рекомендуется использовать 'const' или 'let'")

        # Проверка на использование == вместо ===
        if re.search(r"[^=!]==[^=]", code):
            warnings.append("Используется '==' — рекомендуется использовать строгое сравнение '==='")

        # Проверка на наличие магических чисел
        magic_numbers = re.findall(r"\b\d{4,}\b", code)
        if magic_numbers:
            info.append(f"Обнаружены магические числа: {', '.join(magic_numbers[:5])}. Рекомендуется выносить в константы.")

        # Проверка именование переменных
        camel_case_vars = re.findall(r"(?:const|let|var)\s+([a-z][a-zA-Z0-9]*)\s*=", code)
        if not camel_case_vars:
            info.append("Не найдены переменные в camelCase стиле")

        info.append("Best practices проверены")

        return {"valid": True, "warnings": warnings, "info": info}


def validate_typescript(code: str, target_json: str = None) -> Dict[str, Any]:
    """
    Удобная функция для валидации TypeScript кода.

    Args:
        code: TypeScript код для проверки
        target_json: Целевая JSON схема для проверки соответствия

    Returns:
        Dict с результатами валидации
    """
    validator = TypeScriptValidator()
    return validator.validate(code, target_json)
