#!/usr/bin/env python3
"""
CLI утилита для проверки сгенерированного TypeScript кода.

Использование:
    python check_ts.py --file code.ts
    python check_ts.py --base64 "ZXhwb3J0IGZ1bmN0aW9u..."
    python check_ts.py --file code.ts --expected expected.json
    python check_ts.py --test sample.csv "{\"data\": []}"

Опции:
    --file        Путь к файлу с TypeScript кодом
    --base64      TypeScript код в base64
    --code        TypeScript код напрямую (экранировать!)
    --expected    JSON файл с ожидаемой схемой
    --validate    Только валидация (без проверки схемы)
    --execute     Выполнить код через tsx (если установлен)
"""

import argparse
import base64
import json
import sys
import subprocess
import tempfile
from pathlib import Path

# Добавляем src в путь для импортов
sys.path.insert(0, str(Path(__file__).parent))

from validator import validate_typescript
from converter import FileProcessor, TypeScriptCodeGenerator


def load_typescript_code(args) -> str:
    """Загрузка TypeScript кода из различных источников."""
    if args.file:
        path = Path(args.file)
        if not path.exists():
            raise FileNotFoundError(f"Файл не найден: {path}")
        return path.read_text(encoding="utf-8")

    elif args.base64:
        try:
            decoded = base64.b64decode(args.base64).decode("utf-8")
            return decoded
        except Exception as e:
            raise ValueError(f"Ошибка декодирования base64: {e}")

    elif args.code:
        return args.code

    else:
        # Читаем из stdin
        print("Введите TypeScript код (Ctrl+D для завершения):")
        return sys.stdin.read()


def load_expected_schema(args) -> str | None:
    """Загрузка ожидаемой схемы."""
    if not args.expected:
        return None

    path = Path(args.expected)
    if not path.exists():
        raise FileNotFoundError(f"Файл не найден: {path}")

    return path.read_text(encoding="utf-8")


def validate_code(code: str, expected_schema: str | None) -> dict:
    """Валидация TypeScript кода."""
    result = validate_typescript(code, expected_schema)
    return result


def execute_code(code: str, timeout: int = 10) -> dict:
    """Выполнение TypeScript кода через tsx."""
    # Создаём обёртку для выполнения
    wrapped = f"""
{code}

// Run and output result
(async () => {{
    const testInput = "id,name\\n1,test\\n2,demo";
    try {{
        const result = await transformData(testInput);
        console.log(JSON.stringify({{ success: true, data: result }}, null, 2));
    }} catch (e) {{
        console.error(JSON.stringify({{ success: false, error: e.message }}, null, 2));
        process.exit(1);
    }}
}})();
"""

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".ts", delete=False, encoding="utf-8"
    ) as f:
        f.write(wrapped)
        temp_path = f.name

    try:
        result = subprocess.run(
            ["tsx", temp_path],
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except:
                return {"success": True, "raw_output": result.stdout}
        else:
            return {
                "success": False,
                "error": result.stderr or f"Exit code: {result.returncode}",
            }
    except FileNotFoundError:
        return {
            "success": False,
            "error": "tsx не установлен. Установите: npm install -g tsx",
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "error": f"Таймаут {timeout}s"}
    finally:
        Path(temp_path).unlink(missing_ok=True)


def check_with_sample(code: str, sample_file: str, target_json: str) -> dict:
    """Проверка кода с примером данных."""
    # Генерируем код если не передан
    generator = TypeScriptCodeGenerator({"provider": "mock"})

    if sample_file:
        try:
            fp = FileProcessor()
            file_data = fp.process_file(sample_file)
            code = generator.generate(file_data, target_json)
            print(f"[INFO] Сгенерирован код из файла: {sample_file}")
        except Exception as e:
            return {"success": False, "error": f"Ошибка обработки файла: {e}"}

    # Выполняем
    exec_result = execute_code(code)

    return {
        "validation": validate_code(code, target_json),
        "execution": exec_result,
    }


def print_result(result: dict, verbose: bool = False):
    """Красивый вывод результата."""
    if result.get("valid") is None:
        # Это результат check_with_sample
        validation = result.get("validation", {})
        execution = result.get("execution", {})

        print("\n" + "=" * 50)
        print("РЕЗУЛЬТАТ ПРОВЕРКИ")
        print("=" * 50)

        # Валидация
        valid = validation.get("valid", False)
        status = "✓ ВАЛИДЕН" if valid else "✕ ОШИБКИ"
        print(f"\nСтатус: {status}")

        if validation.get("errors"):
            print(f"\nОшибки ({len(validation['errors'])}):")
            for err in validation["errors"]:
                print(f"  • {err}")

        if validation.get("warnings"):
            print(f"\nПредупреждения ({len(validation['warnings'])}):")
            for warn in validation["warnings"]:
                print(f"  ⚠ {warn}")

        # Выполнение
        print(f"\nВыполнение:")
        if execution.get("success"):
            print("  ✓ Выполнен успешно")
            if verbose and execution.get("data"):
                print(f"\nРезультат:\n{json.dumps(execution['data'], indent=2)[:500]}")
        else:
            print(f"  ✕ Ошибка: {execution.get('error', 'Неизвестно')}")

        return valid and execution.get("success", False)

    else:
        # Это результат validate_typescript
        valid = result.get("valid", False)
        print("\n" + "=" * 50)
        print("РЕЗУЛЬТАТ ВАЛИДАЦИИ")
        print("=" * 50)

        status = "✓ ВАЛИДЕН" if valid else "✕ ОШИБКИ"
        print(f"\nСтатус: {status}")

        if result.get("errors"):
            print(f"\nОшибки ({len(result['errors'])}):")
            for err in result["errors"]:
                print(f"  • {err}")

        if result.get("warnings"):
            print(f"\nПредупреждения ({len(result['warnings'])}):")
            for warn in result["warnings"]:
                print(f"  ⚠ {warn}")

        if verbose and result.get("metrics"):
            print(f"\nМетрики:")
            for key, val in result["metrics"].items():
                if isinstance(val, list):
                    print(f"  {key}: {len(val)} найдено")
                else:
                    print(f"  {key}: {val}")

        return valid


def main():
    parser = argparse.ArgumentParser(
        description="CLI для проверки сгенерированного TypeScript кода",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры:
  Проверка файла:
    python check_ts.py --file output.ts
    
  Проверка с ожидаемой схемой:
    python check_ts.py --file output.ts --expected schema.json
    
  Проверка из base64:
    python check_ts.py --base64 "ZXhwb3J0IGZ1bmN0aW9u..."
    
  Генерация и проверка из CSV:
    python check_ts.py --test data.csv '{"data": []}'
    
  Выполнение кода:
    python check_ts.py --file output.ts --execute
""",
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--file", "-f", help="Путь к TypeScript файлу")
    group.add_argument("--base64", "-b", help="TypeScript код в base64")
    group.add_argument("--code", "-c", help="TypeScript код напрямую")
    group.add_argument(
        "--test", nargs=2, metavar=("FILE", "JSON"), help="Тест: файл + целевой JSON"
    )

    parser.add_argument("--expected", "-e", help="JSON файл с ожидаемой схемой")
    parser.add_argument(
        "--execute", action="store_true", help="Выполнить код через tsx"
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Подробный вывод")

    args = parser.parse_args()

    try:
        # Загрузка кода
        if args.test:
            sample_file, target_json = args.test
            result = check_with_sample("", sample_file, target_json)
            success = print_result(result, args.verbose)
        else:
            code = load_typescript_code(args)
            expected = load_expected_schema(args)

            if args.execute:
                print("[INFO] Выполнение кода...")
                exec_result = execute_code(code)
                validation = validate_code(code, expected)
                result = {"validation": validation, "execution": exec_result}
                success = print_result(result, args.verbose)
            else:
                result = validate_code(code, expected)
                success = print_result(result, args.verbose)

        sys.exit(0 if success else 1)

    except Exception as e:
        print(f"\n[ERROR] {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
