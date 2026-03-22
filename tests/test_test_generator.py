"""
Tests for test_generator module.
"""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from test_generator import TestGenerator, generate_tests


class TestTestGenerator:
    """Tests for TestGenerator class."""

    @pytest.fixture
    def generator(self):
        """Create test generator instance."""
        return TestGenerator()

    def test_generate_tests_basic(
        self, generator, sample_typescript_code, sample_target_json
    ):
        """Test basic test generation."""
        result = generator.generate_tests(
            sample_typescript_code, sample_target_json, "data.csv"
        )
        assert isinstance(result, str)
        assert "transformData" in result
        assert "describe" in result

    def test_generate_tests_template(self, generator):
        """Test generated tests follow template."""
        result = generator.generate_tests(
            "export async function transformData(input: string): Promise<any> {}",
            '{"name": "string"}',
            "test",
        )
        assert "import" in result
        assert "describe('transformData'" in result
        assert "test(" in result

    def test_extract_required_fields(self, generator, sample_target_json):
        """Test extraction of required fields from JSON."""
        fields = generator._extract_required_fields(sample_target_json)
        assert isinstance(fields, dict)

    def test_extract_optional_fields(self, generator):
        """Test extraction of optional fields from JSON."""
        json_with_nulls = '[{"name": "test", "optional": null}]'
        optional = generator._extract_optional_fields(json_with_nulls)
        assert isinstance(optional, list)

    def test_generate_empty_input_test(self, generator):
        """Test empty input test generation."""
        result = generator._generate_empty_input_test()
        assert "empty" in result.lower() or "throw" in result.lower()

    def test_generate_valid_input_test(self, generator):
        """Test valid input test generation."""
        fields = {"name": "string", "age": "number"}
        result = generator._generate_valid_input_test(fields, "Person")
        assert "valid" in result.lower() or "transformData" in result

    def test_generate_error_handling_test(self, generator):
        """Test error handling test generation."""
        result = generator._generate_error_handling_test()
        assert "error" in result.lower() or "malformed" in result.lower()


class TestGenerateTestsFunction:
    """Tests for generate_tests convenience function."""

    def test_generate_tests_function(self, sample_typescript_code, sample_target_json):
        """Test convenience function works correctly."""
        result = generate_tests(sample_typescript_code, sample_target_json, "data")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_generate_tests_with_different_filename(
        self, sample_typescript_code, sample_target_json
    ):
        """Test test generation with different filenames."""
        result = generate_tests(
            sample_typescript_code, sample_target_json, "my-file.csv"
        )
        assert "my-file" in result
