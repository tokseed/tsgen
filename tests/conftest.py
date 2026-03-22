"""
Test configuration for pytest.
"""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


@pytest.fixture
def sample_csv_content():
    """Sample CSV content for testing."""
    return "id,name,age,city\n1,John,30,NYC\n2,Jane,25,LA\n3,Bob,35,Chicago"


@pytest.fixture
def sample_target_json():
    """Sample target JSON schema for testing."""
    return """{
  "data": [
    {
      "id": "number",
      "name": "string",
      "age": "number",
      "city": "string"
    }
  ],
  "metadata": {
    "sourceType": "string",
    "rowCount": "number",
    "processedAt": "string"
  }
}"""


@pytest.fixture
def sample_typescript_code():
    """Sample TypeScript code for testing."""
    return """
export interface Person {
  id: number;
  name: string;
  age: number;
  city: string;
}

export interface Metadata {
  sourceType: string;
  rowCount: number;
  processedAt: string;
}

export interface TransformResult {
  data: Person[];
  metadata: Metadata;
}

export async function transformData(input: string): Promise<TransformResult> {
  try {
    const lines = input.trim().split('\\n');
    if (lines.length === 0) throw new Error('Empty input');

    const headers = lines[0].split(',').map(h => h.trim());
    
    const result: TransformResult = {
      data: [],
      metadata: {
        sourceType: 'csv',
        rowCount: lines.length - 1,
        processedAt: new Date().toISOString(),
      },
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const person: any = {};
      headers.forEach((header, idx) => {
        const value = values[idx];
        if (header === 'id' || header === 'age') {
          person[header] = Number(value);
        } else {
          person[header] = value;
        }
      });
      result.data.push(person);
    }

    return result;
  } catch (error) {
    throw new Error(`Transform error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
"""


@pytest.fixture
def mock_llm_config():
    """Mock LLM configuration."""
    return {
        "provider": "mock",
    }


@pytest.fixture
def mock_openrouter_config():
    """Mock OpenRouter configuration."""
    return {
        "provider": "openrouter",
        "api_key": "sk-test-mock-key",
    }
