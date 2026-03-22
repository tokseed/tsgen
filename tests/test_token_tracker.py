"""
Tests for token_tracker module.
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from token_tracker import (
    LangFuseTokenTracker,
    TokenUsage,
    CostEstimate,
    GenerationRecord,
    TokenomicsSummary,
    get_token_tracker,
)


class TestTokenUsage:
    """Tests for TokenUsage dataclass."""

    def test_token_usage_creation(self):
        """Test TokenUsage creation."""
        usage = TokenUsage(prompt_tokens=100, completion_tokens=50)
        assert usage.prompt_tokens == 100
        assert usage.completion_tokens == 50
        assert usage.total_tokens == 150


class TestCostEstimate:
    """Tests for CostEstimate dataclass."""

    def test_cost_estimate_creation(self):
        """Test CostEstimate creation."""
        cost = CostEstimate(prompt_cost=0.001, completion_cost=0.002)
        assert cost.total_cost == 0.003

    def test_cost_calculation_claude(self):
        """Test cost calculation for Claude."""
        usage = TokenUsage(prompt_tokens=1000, completion_tokens=500)
        cost = CostEstimate.calculate(usage, "anthropic/claude-3.5-sonnet")

        assert cost.prompt_cost > 0
        assert cost.completion_cost > 0
        assert cost.total_cost > 0

    def test_cost_calculation_free_model(self):
        """Test cost calculation for free model."""
        usage = TokenUsage(prompt_tokens=1000, completion_tokens=500)
        cost = CostEstimate.calculate(usage, "meta-llama/llama-3.2-3b-instruct:free")

        assert cost.total_cost == 0.0


class TestGenerationRecord:
    """Tests for GenerationRecord dataclass."""

    def test_generation_record_creation(self):
        """Test GenerationRecord creation."""
        record = GenerationRecord(
            id="test-123",
            timestamp=datetime.now().isoformat(),
            provider="openrouter",
            model="claude-3.5-sonnet",
            file_type="csv",
            input_tokens=100,
            output_tokens=50,
            total_tokens=150,
            duration_ms=1000.0,
            cost_usd=0.01,
            success=True,
        )

        assert record.id == "test-123"
        assert record.success is True
        assert record.cache_hit is False


class TestTokenomicsSummary:
    """Tests for TokenomicsSummary dataclass."""

    def test_tokenomics_summary_defaults(self):
        """Test TokenomicsSummary defaults."""
        summary = TokenomicsSummary()

        assert summary.total_generations == 0
        assert summary.successful_generations == 0
        assert summary.total_tokens == 0
        assert summary.estimated_cost_usd == 0.0

    def test_tokenomics_summary_with_records(self):
        """Test TokenomicsSummary aggregation."""
        from token_tracker import _tracker

        tracker = _tracker or LangFuseTokenTracker()

        record1 = GenerationRecord(
            id="test-1",
            timestamp=datetime.now().isoformat(),
            provider="openrouter",
            model="claude",
            file_type="csv",
            input_tokens=100,
            output_tokens=50,
            total_tokens=150,
            duration_ms=1000.0,
            cost_usd=0.01,
            success=True,
        )

        record2 = GenerationRecord(
            id="test-2",
            timestamp=datetime.now().isoformat(),
            provider="openrouter",
            model="claude",
            file_type="xlsx",
            input_tokens=200,
            output_tokens=100,
            total_tokens=300,
            duration_ms=2000.0,
            cost_usd=0.02,
            success=False,
        )

        tracker._records = [record1, record2]
        summary = tracker.get_summary()

        assert summary.total_generations == 2
        assert summary.successful_generations == 1
        assert summary.failed_generations == 1
        assert summary.total_tokens == 450
        assert summary.total_input_tokens == 300
        assert summary.total_output_tokens == 150


class TestLangFuseTokenTracker:
    """Tests for LangFuseTokenTracker class."""

    def test_tracker_creation(self):
        """Test tracker creation."""
        tracker = LangFuseTokenTracker()
        assert tracker is not None
        assert hasattr(tracker, "_enabled")
        assert hasattr(tracker, "_records")

    def test_tracker_record_generation(self):
        """Test recording generation."""
        tracker = LangFuseTokenTracker()

        record = GenerationRecord(
            id="test-123",
            timestamp=datetime.now().isoformat(),
            provider="openrouter",
            model="claude-3.5-sonnet",
            file_type="csv",
            input_tokens=100,
            output_tokens=50,
            total_tokens=150,
            duration_ms=1000.0,
            cost_usd=0.01,
            success=True,
        )

        tracker.record_generation(record)
        assert len(tracker._records) == 1

    def test_tracker_clear_records(self):
        """Test clearing records."""
        tracker = LangFuseTokenTracker()

        record = GenerationRecord(
            id="test-123",
            timestamp=datetime.now().isoformat(),
            provider="openrouter",
            model="claude",
            file_type="csv",
            input_tokens=100,
            output_tokens=50,
            total_tokens=150,
            duration_ms=1000.0,
            cost_usd=0.01,
            success=True,
        )

        tracker.record_generation(record)
        tracker.clear_records()
        assert len(tracker._records) == 0

    def test_get_summary_empty(self):
        """Test summary with no records."""
        tracker = LangFuseTokenTracker()
        tracker._records = []

        summary = tracker.get_summary()
        assert summary.total_generations == 0


def test_get_token_tracker_singleton():
    """Test get_token_tracker returns singleton."""
    tracker1 = get_token_tracker()
    tracker2 = get_token_tracker()
    assert tracker1 is tracker2
