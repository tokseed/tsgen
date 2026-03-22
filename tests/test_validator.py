"""
Tests for validator module.
"""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from validator import TypeScriptValidator, validate_typescript


class TestTypeScriptValidator:
    """Tests for TypeScriptValidator class."""

    @pytest.fixture
    def validator(self):
        """Create validator instance."""
        return TypeScriptValidator()

    def test_validate_valid_code(self, validator, sample_typescript_code):
        """Test validation of valid TypeScript code."""
        result = validator.validate(sample_typescript_code)
        assert "valid" in result
        assert "errors" in result
        assert "warnings" in result
        assert "metrics" in result

    def test_validate_empty_code(self, validator):
        """Test validation of empty code returns error."""
        result = validator.validate("")
        assert result["valid"] is False
        assert len(result["errors"]) > 0

    def test_validate_missing_transform_function(self, validator):
        """Test validation detects missing transformData function."""
        code = "const x = 1;"
        result = validator.validate(code)
        assert result["valid"] is False
        assert any("transformData" in str(e) for e in result["errors"])

    def test_validate_markdown_in_code(self, validator):
        """Test validation detects markdown in code."""
        code = "```typescript\nconst x = 1;\n```"
        result = validator.validate(code)
        assert any("markdown" in str(e).lower() for e in result["errors"])

    def test_validate_unbalanced_brackets(self, validator):
        """Test validation detects unbalanced brackets."""
        code = "function test() { if (x > 0 { return x; } }"
        result = validator.validate(code)
        assert result["valid"] is False

    def test_validate_with_target_json(
        self, validator, sample_typescript_code, sample_target_json
    ):
        """Test validation with target JSON schema."""
        result = validator.validate(sample_typescript_code, sample_target_json)
        assert "valid" in result

    def test_check_basic_syntax(self, validator):
        """Test basic syntax checking."""
        result = validator._check_basic_syntax("const x = 1;")
        assert "valid" in result
        assert "errors" in result

    def test_metrics_collection(self, validator, sample_typescript_code):
        """Test metrics are collected correctly."""
        result = validator.validate(sample_typescript_code)
        assert "function_count" in result["metrics"]
        assert "interface_count" in result["metrics"]
        assert "lines" in result["metrics"]


class TestValidateTypescriptFunction:
    """Tests for validate_typescript convenience function."""

    def test_validate_typescript_function(self, sample_typescript_code):
        """Test convenience function works correctly."""
        result = validate_typescript(sample_typescript_code)
        assert isinstance(result, dict)
        assert "valid" in result
