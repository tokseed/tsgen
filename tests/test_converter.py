"""
Тестовый скрипт для проверки работы конвертера
"""

import sys
from pathlib import Path

# Добавляем корень проекта в path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.converter import ConverterAgent, generate_typescript

def test_csv_conversion():
    """Тест обработки CSV файла"""
    print("=" * 50)
    print("Тест: Обработка CSV файла")
    print("=" * 50)
    
    test_file = Path(__file__).parent / "test_data.csv"
    target_json = '''{
  "data": [],
  "metadata": {
    "sourceType": "csv",
    "columns": [],
    "rowCount": 0
  }
}'''
    
    if not test_file.exists():
        print(f"❌ Тестовый файл не найден: {test_file}")
        return
    
    try:
        # Генерация кода (в mock режиме)
        code = generate_typescript(
            filepath=str(test_file),
            target_json=target_json,
            llm_config={'provider': 'mock'}
        )
        
        print("✅ Код успешно сгенерирован!")
        print("\n" + "=" * 50)
        print("Сгенерированный TypeScript код:")
        print("=" * 50)
        print(code)
        print("\n" + "=" * 50)
        
        # Проверка наличия ключевых элементов
        checks = [
            ('function transformData', 'Сигнатура функции'),
            ('interface', 'TypeScript интерфейсы'),
            ('try', 'Обработка ошибок'),
            ('metadata', 'Метаданные'),
        ]
        
        print("\nПроверка структуры кода:")
        for pattern, description in checks:
            if pattern in code:
                print(f"  ✅ {description}")
            else:
                print(f"  ⚠️ {description} (не найдено)")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()


def test_file_processor():
    """Тест процессора файлов"""
    print("\n" + "=" * 50)
    print("Тест: ProcessFile CSV")
    print("=" * 50)
    
    from src.converter import FileProcessor
    
    test_file = Path(__file__).parent / "test_data.csv"
    
    if not test_file.exists():
        print(f"❌ Тестовый файл не найден: {test_file}")
        return
    
    try:
        result = FileProcessor.process_file(str(test_file))
        
        print(f"✅ Тип файла: {result['type']}")
        print(f"✅ Структура: {result['structure']}")
        print(f"\nПример содержимого (первые 500 символов):")
        print(result['content'][:500])
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")


if __name__ == "__main__":
    print("\n🧪 Тестирование TypeScript Code Generator\n")
    
    test_file_processor()
    test_csv_conversion()
    
    print("\n✅ Тестирование завершено!")
