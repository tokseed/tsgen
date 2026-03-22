// Интерфейсы для типизации
export interface TargetData {
  code: string;
  description: string;
}

export interface Metadata {
  sourceType: string;
  rowCount: number;
  processedAt: string;
}

export interface ParsedData {
  code: string | null;
  description: string | null;
}

/**
 * Парсит входные данные и преобразует в формат JSON
 * @param input - содержимое файла в виде строки
 * @returns Promise<TargetData[]> с преобразованными данными
 * @throws Error при неверном формате или отсутствии обязательных полей
 */
export async function transformData(input: string): Promise<TargetData[]> {
  try {
    // 1. Проверка пустого ввода
    if (!input || input.trim() === '') {
      throw new Error('Пустой файл: входные данные не содержат строк');
    }

    // 2. Парсинг входных данных
    const lines = input.trim().split('\n');
    const result: TargetData[] = [];

    // 3. Обработка каждой строки
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('Table 1:')) {
        // Обработка таблицы
        const tableLines = lines.slice(i + 1);
        for (const tableLine of tableLines) {
          const values = tableLine.trim().split('|').map(v => v.trim());
          if (values.length >= 3) {
            const code = values[2];
            const description = values[0];
            if (code && description) {
              result.push({
                code,
                description,
              });
            }
          }
        }
      }
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Ошибка трансформации: ${error.message}`);
    }
    throw new Error('Неизвестная ошибка при трансформации');
  }
}

// Вспомогательные функции
function parseNumber(value: string, fieldName: string): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Неверный тип поля ${fieldName}: ожидался number, получен "${value}"`);
  }
  return num;
}