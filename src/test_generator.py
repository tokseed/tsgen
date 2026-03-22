"""
TypeScript Test Generator.
Генерация unit-тестов для сгенерированного TypeScript кода.
"""

import re
from typing import Dict, Any, List


class TestGenerator:
    """Генератор unit-тестов для TypeScript кода."""

    TEST_TEMPLATE = """/**
 * Unit tests for transformData function
 * Generated automatically
 */

import {{ transformData{interface_import} }} from './{filename}';

describe('transformData', () => {{
{tests}
}});
"""

    def __init__(self):
        self.test_cases = []

    def generate_tests(
        self,
        typescript_code: str,
        target_json: str,
        original_filename: str = "data",
    ) -> str:
        """
        Генерация unit-тестов для TypeScript кода.

        Args:
            typescript_code: Сгенерированный TypeScript код
            target_json: Целевая JSON схема
            original_filename: Имя исходного файла

        Returns:
            Код тестов в формате Vitest/Jest
        """
        # Извлекаем имя интерфейса
        interface_match = re.search(
            r"export async function transformData\([^)]+\): Promise<(\w+)>",
            typescript_code,
        )
        interface_name = interface_match.group(1) if interface_match else "TargetData"

        # Извлекаем поля из целевого JSON
        required_fields = self._extract_required_fields(target_json)
        optional_fields = self._extract_optional_fields(target_json)

        # Генерируем тесты
        tests = []

        # Тест 1: Пустой ввод
        tests.append(self._generate_empty_input_test())

        # Тест 2: Валидный ввод
        tests.append(self._generate_valid_input_test(required_fields, interface_name))

        # Тест 3: Проверка типов
        tests.append(self._generate_type_check_test(required_fields, interface_name))

        # Тест 4: Проверка обязательных полей
        if required_fields:
            tests.append(self._generate_required_fields_test(required_fields))

        # Тест 5: Проверка обработки ошибок
        tests.append(self._generate_error_handling_test())

        # Тест 6: Проверка числовых значений
        numeric_fields = self._get_numeric_fields(required_fields)
        if numeric_fields:
            tests.append(self._generate_numeric_test(numeric_fields))

        # Собираем итоговый код
        interface_import = f", {interface_name}" if interface_name else ""
        return self.TEST_TEMPLATE.format(
            interface_import=interface_import,
            filename=original_filename.replace(".ts", ""),
            tests="\n\n".join(tests),
        )

    def _extract_required_fields(self, target_json: str) -> Dict[str, str]:
        """Извлечение обязательных полей из JSON."""
        fields = {}
        try:
            import json

            data = json.loads(target_json)
            if isinstance(data, list) and len(data) > 0:
                sample = data[0]
                for key, value in sample.items():
                    if value is not None:
                        field_type = type(value).__name__
                        fields[key] = {
                            "str": "string",
                            "int": "number",
                            "float": "number",
                            "bool": "boolean",
                        }.get(field_type, "any")
        except Exception:
            pass
        return fields

    def _extract_optional_fields(self, target_json: str) -> List[str]:
        """Извлечение опциональных полей из JSON."""
        optional = []
        try:
            import json

            data = json.loads(target_json)
            if isinstance(data, list) and len(data) > 0:
                sample = data[0]
                for key, value in sample.items():
                    if value is None:
                        optional.append(key)
        except Exception:
            pass
        return optional

    def _generate_empty_input_test(self) -> str:
        """Генерация теста для пустого ввода."""
        return """  test('should throw error on empty input', async () => {{
    await expect(transformData('')).rejects.toThrow();
  }});"""

    def _generate_valid_input_test(
        self, fields: Dict[str, str], interface_name: str
    ) -> str:
        """Генерация теста для валидного ввода."""
        sample_data = self._generate_sample_data(fields)
        return f"""  test('should transform valid input to {interface_name}', async () => {{
    const input = `{sample_data}`;
    const result = await transformData(input);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  }});"""

    def _generate_type_check_test(
        self, fields: Dict[str, str], interface_name: str
    ) -> str:
        """Генерация теста проверки типов."""
        if not fields:
            return """  test('should return correctly typed result', async () => {{
    const result = await transformData('test input');
    expect(result).toBeDefined();
  }});"""

        first_field = list(fields.keys())[0]
        expected_type = fields[first_field]

        type_check = {
            "string": "typeof result[0].{field} === 'string'",
            "number": "typeof result[0].{field} === 'number'",
            "boolean": "typeof result[0].{field} === 'boolean'",
        }.get(expected_type, "result[0].{field} !== undefined")

        return f"""  test('should return correctly typed {interface_name} array', async () => {{
    const input = 'test data';
    const result = await transformData(input);
    
    if (result.length > 0) {{
      expect({type_check.format(field=first_field)}).toBe(true);
    }}
  }});"""

    def _generate_required_fields_test(self, fields: Dict[str, str]) -> str:
        """Генерация теста проверки обязательных полей."""
        field_checks = "\n".join(
            [f"      expect(item).toHaveProperty('{field}');" for field in fields.keys()]
        )
        return f"""  test('should include all required fields', async () => {{
    const input = 'test data';
    const result = await transformData(input);
    
    for (const item of result) {{
{field_checks}
    }}
  }});"""

    def _generate_error_handling_test(self) -> str:
        """Генерация теста обработки ошибок."""
        return """  test('should handle malformed input gracefully', async () => {{
    const malformedInput = 'invalid\\ndata\\nwith\\nwrong\\nformat';
    
    // Функция должна либо вернуть результат, либо выбросить понятную ошибку
    try {{
      const result = await transformData(malformedInput);
      expect(result).toBeDefined();
    }} catch (error) {{
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBeTruthy();
    }}
  }});"""

    def _generate_numeric_test(self, numeric_fields: List[str]) -> str:
        """Генерация теста числовых полей."""
        field_checks = "\n".join(
            [
                f"      if (item.{field} !== undefined) {{\n        expect(typeof item.{field}).toBe('number');\n      }}"
                for field in numeric_fields[:3]
            ]
        )
        return f"""  test('should correctly parse numeric fields', async () => {{
    const input = 'test data';
    const result = await transformData(input);
    
    for (const item of result) {{
{field_checks}
    }}
  }});"""

    def _generate_sample_data(self, fields: Dict[str, str]) -> str:
        """Генерация примера данных для теста."""
        if not fields:
            return "sample data"

        sample_values = []
        for field, field_type in fields.items():
            if field_type == "number":
                sample_values.append("123")
            elif field_type == "boolean":
                sample_values.append("true")
            else:
                sample_values.append(f"value_{field}")

        return ";".join(list(fields.keys()) + sample_values)

    def _get_numeric_fields(self, fields: Dict[str, str]) -> List[str]:
        """Получение списка числовых полей."""
        return [f for f, t in fields.items() if t == "number"]


def generate_tests(
    typescript_code: str,
    target_json: str,
    original_filename: str = "data",
) -> str:
    """
    Удобная функция для генерации тестов.

    Args:
        typescript_code: Сгенерированный TypeScript код
        target_json: Целевая JSON схема
        original_filename: Имя исходного файла

    Returns:
        Код тестов
    """
    generator = TestGenerator()
    return generator.generate_tests(typescript_code, target_json, original_filename)
