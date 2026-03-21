#!/usr/bin/env python3
"""
CLI утилита для тестирования генератора TypeScript кода

Использование:
    python cli.py <путь_к_файлу> <target_json>
    
Пример:
    python cli.py tests/test_data.csv "{\"data\": [], \"metadata\": {}}"
"""

import sys
import json
from pathlib import Path

# Добавляем src в path
sys.path.insert(0, str(Path(__file__).parent))

from converter import generate_typescript, FileProcessor


def main():
    if len(sys.argv) < 3:
        print("Использование: python cli.py <путь_к_файлу> <target_json>")
        print("\nПример:")
        print('  python cli.py tests/test_data.csv \'{"data": [], "metadata": {}}\'')
        print("\nИли в интерактивном режиме (без аргументов):")
        print("  python cli.py")
        sys.exit(1)
    
    filepath = sys.argv[1]
    target_json = sys.argv[2]
    
    # Проверка файла
    if not Path(filepath).exists():
        print(f"❌ Файл не найден: {filepath}")
        sys.exit(1)
    
    # Валидация JSON
    try:
        json.loads(target_json)
    except json.JSONDecodeError as e:
        print(f"❌ Некорректный JSON: {e}")
        sys.exit(1)
    
    print(f"📁 Обработка файла: {filepath}")
    print(f"📄 Тип: {FileProcessor.get_file_type(filepath)}")
    print("⚙️  Генерация TypeScript кода...")
    print()
    
    try:
        code = generate_typescript(filepath, target_json)
        
        print("=" * 60)
        print("Сгенерированный TypeScript код:")
        print("=" * 60)
        print(code)
        print("=" * 60)
        print("\n✅ Готово!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
