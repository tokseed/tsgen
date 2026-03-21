"""
TypeScript Code Validator.
Валидация сгенерированного TypeScript кода.
"""

import subprocess
import tempfile
from typing import Dict, Any, Optional
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
    "moduleResolution": "node"
  },
  "include": ["*.ts"]
}
"""

    def validate(self, code: str) -> Dict[str, Any]:
        """
        Валидация TypeScript кода.

        Args:
            code: TypeScript код для проверки

        Returns:
            Dict с результатами:
            - valid: bool (валиден ли код)
            - errors: list (список ошибок)
            - warnings: list (список предупреждений)
        """
        errors = []
        warnings = []

        # Базовая проверка синтаксиса
        syntax_result = self._check_basic_syntax(code)
        if not syntax_result["valid"]:
            errors.extend(syntax_result["errors"])
            return {"valid": False, "errors": errors, "warnings": warnings}

        # Проверка через tsc (если доступен)
        tsc_result = self._check_with_tsc(code)
        errors.extend(tsc_result["errors"])
        warnings.extend(tsc_result["warnings"])

        # Проверка структуры кода
        structure_result = self._check_code_structure(code)
        errors.extend(structure_result["errors"])
        warnings.extend(structure_result["warnings"])

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }

    def _check_basic_syntax(self, code: str) -> Dict[str, Any]:
        """Базовая проверка синтаксиса."""
        errors = []
        warnings = []

        # Проверка на пустой код
        if not code or not code.strip():
            return {"valid": False, "errors": ["Пустой код"]}

        # Проверка парных скобок
        brackets = {"{": "}", "(": ")", "[": "]"}
        stack = []
        in_string = False
        string_char = None

        for char in code:
            if char in '"\'`' and (not stack or stack[-1] not in brackets):
                if not in_string:
                    in_string = True
                    string_char = char
                elif char == string_char:
                    in_string = False
                    string_char = None
            elif not in_string:
                if char in brackets:
                    stack.append(char)
                elif char in brackets.values():
                    if not stack:
                        errors.append(f"Лишняя закрывающая скобка '{char}'")
                    else:
                        expected = brackets[stack.pop()]
                        if char != expected:
                            errors.append(f"Несбалансированные скобки: ожидалось '{expected}', получено '{char}'")

        if stack:
            errors.append(f"Несбалансированные скобки: не закрыты {stack}")

        # Проверка наличия export function transformData
        if "export" not in code or "transformData" not in code:
            errors.append("Отсутствует экспортируемая функция transformData")

        # Проверка наличия интерфейсов
        if "interface" not in code:
            warnings.append("Рекомендуется добавить TypeScript интерфейсы для типизации")

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}

    def _check_with_tsc(self, code: str) -> Dict[str, Any]:
        """Проверка через TypeScript compiler."""
        errors = []
        warnings = []

        try:
            # Создаём временную директорию
            with tempfile.TemporaryDirectory() as tmpdir:
                # Записываем TS файл
                ts_file = Path(tmpdir) / "code.ts"
                ts_file.write_text(code, encoding="utf-8")

                # Записываем tsconfig.json
                config_file = Path(tmpdir) / "tsconfig.json"
                config_file.write_text(self.ts_config, encoding="utf-8")

                # Запускаем tsc
                result = subprocess.run(
                    ["tsc", "--noEmit", "--pretty", "false"],
                    cwd=tmpdir,
                    capture_output=True,
                    text=True,
                    timeout=30,
                )

                if result.returncode != 0:
                    # Парсим вывод tsc
                    for line in result.stderr.split("\n") + result.stdout.split("\n"):
                        line = line.strip()
                        if line and "error TS" in line:
                            errors.append(f"TS Error: {line}")
                        elif line and "warning" in line.lower():
                            warnings.append(line)

        except FileNotFoundError:
            warnings.append("TypeScript compiler (tsc) не найден. Пропущена полная проверка.")
        except subprocess.TimeoutExpired:
            warnings.append("Превышено время проверки TypeScript compiler")
        except Exception as e:
            warnings.append(f"Ошибка при проверке tsc: {str(e)}")

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}

    def _check_code_structure(self, code: str) -> Dict[str, Any]:
        """Проверка структуры кода."""
        errors = []
        warnings = []

        # Проверка наличия async/await
        if "async" in code and "await" not in code:
            warnings.append("Функция объявлена как async, но не использует await")

        # Проверка наличия try/catch
        if "throw" in code and "try" not in code:
            warnings.append("Код выбрасывает исключения, но не обрабатывает их через try/catch")

        # Проверка на использование any
        if ": any" in code:
            warnings.append("Используется тип 'any' — рекомендуется использовать строгие типы")

        # Проверка наличия JSDoc
        if "/**" not in code and "export" in code:
            warnings.append("Отсутствуют JSDoc комментарии для экспортируемых функций")

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


def validate_typescript(code: str) -> Dict[str, Any]:
    """
    Удобная функция для валидации TypeScript кода.

    Args:
        code: TypeScript код для проверки

    Returns:
        Dict с результатами валидации
    """
    validator = TypeScriptValidator()
    return validator.validate(code)
