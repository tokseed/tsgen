"""
LangFuse Tokenomics Tracker for TypeScript Code Generator.
Provides comprehensive tracking of LLM usage, costs, and performance metrics.
"""

import os
import time
from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass, field, asdict
from enum import Enum

try:
    from langfuse import Langfuse
    from langfuse.api_resources.dataset import Dataset

    LANGFUSE_AVAILABLE = True
except ImportError:
    LANGFUSE_AVAILABLE = False


class ModelType(Enum):
    """Supported LLM models."""

    CLAUDE_35_SONNET = "anthropic/claude-3.5-sonnet"
    LLAMA_3_3_70B = "meta-llama/llama-3.3-70b-instruct"
    LLAMA_3_2_3B = "meta-llama/llama-3.2-3b-instruct:free"
    GEMMA_2_9B = "google/gemma-2-9b-it:free"
    GIGACHAT_2 = "GigaChat-2"
    GPT_4 = "gpt-4"


@dataclass
class TokenUsage:
    """Token usage record."""

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


@dataclass
class CostEstimate:
    """Estimated cost in USD."""

    prompt_cost: float = 0.0
    completion_cost: float = 0.0
    total_cost: float = 0.0

    @staticmethod
    def calculate(usage: TokenUsage, model: str) -> "CostEstimate":
        """Calculate cost based on model and token usage."""
        costs = {
            "anthropic/claude-3.5-sonnet": {"prompt": 0.000003, "completion": 0.000015},
            "meta-llama/llama-3.3-70b-instruct": {
                "prompt": 0.0000007,
                "completion": 0.0000028,
            },
            "meta-llama/llama-3.2-3b-instruct:free": {"prompt": 0.0, "completion": 0.0},
            "google/gemma-2-9b-it:free": {"prompt": 0.0, "completion": 0.0},
            "GigaChat-2": {"prompt": 0.000001, "completion": 0.000002},
        }

        rates = costs.get(model, {"prompt": 0.0, "completion": 0.0})
        prompt_cost = usage.prompt_tokens * rates["prompt"]
        completion_cost = usage.completion_tokens * rates["completion"]

        return CostEstimate(
            prompt_cost=round(prompt_cost, 6),
            completion_cost=round(completion_cost, 6),
            total_cost=round(prompt_cost + completion_cost, 6),
        )


@dataclass
class GenerationRecord:
    """Single generation record."""

    id: str
    timestamp: str
    provider: str
    model: str
    file_type: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    duration_ms: float
    cost_usd: float
    success: bool
    error: Optional[str] = None
    cache_hit: bool = False


@dataclass
class TokenomicsSummary:
    """Summary of token usage and costs."""

    total_generations: int = 0
    successful_generations: int = 0
    failed_generations: int = 0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_tokens: int = 0
    estimated_cost_usd: float = 0.0
    avg_generation_time_ms: float = 0.0
    cache_hit_rate: float = 0.0
    by_provider: Dict[str, int] = field(default_factory=dict)
    by_model: Dict[str, int] = field(default_factory=dict)
    by_file_type: Dict[str, int] = field(default_factory=dict)


class LangFuseTokenTracker:
    """LangFuse integration for comprehensive token tracking."""

    def __init__(self):
        self.langfuse = None
        self._enabled = False
        self._records: List[GenerationRecord] = []
        self._init_langfuse()

    def _init_langfuse(self):
        """Initialize LangFuse client."""
        if not LANGFUSE_AVAILABLE:
            print("[LangFuse] Not installed: pip install langfuse")
            return

        public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
        secret_key = os.getenv("LANGFUSE_SECRET_KEY")
        host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

        if not public_key or not secret_key:
            print("[LangFuse] API keys not configured in .env")
            return

        try:
            self.langfuse = Langfuse(
                public_key=public_key,
                secret_key=secret_key,
                host=host,
            )
            self._enabled = True
            print("[LangFuse] Initialized successfully")
        except Exception as e:
            print(f"[LangFuse] Init error: {e}")

    def start_trace(self, name: str, metadata: Dict[str, Any]) -> Optional[Any]:
        """Start a new trace for a generation."""
        if not self._enabled or not self.langfuse:
            return None

        try:
            return self.langfuse.trace(
                name=name,
                metadata=metadata,
                tags=[metadata.get("provider", "unknown")],
            )
        except Exception as e:
            print(f"[LangFuse] Trace start error: {e}")
            return None

    def end_trace(self, trace, output: Any, usage: TokenUsage, duration_ms: float):
        """End trace with results."""
        if not self._enabled or not trace:
            return

        try:
            trace.update(
                output={"result": str(output)[:500]},
                usage={
                    "promptTokens": usage.prompt_tokens,
                    "completionTokens": usage.completion_tokens,
                    "totalTokens": usage.total_tokens,
                },
                metadata={
                    "duration_ms": duration_ms,
                    "cost_usd": CostEstimate.calculate(usage, "").total_cost,
                },
            )
            self.langfuse.flush()
        except Exception as e:
            print(f"[LangFuse] Trace end error: {e}")

    def record_generation(self, record: GenerationRecord):
        """Record a generation for local tracking."""
        self._records.append(record)

    def get_summary(self) -> TokenomicsSummary:
        """Get tokenomics summary."""
        if not self._records:
            return TokenomicsSummary()

        summary = TokenomicsSummary()
        summary.total_generations = len(self._records)

        cache_hits = 0
        total_duration = 0.0

        for record in self._records:
            if record.success:
                summary.successful_generations += 1
            else:
                summary.failed_generations += 1

            summary.total_input_tokens += record.input_tokens
            summary.total_output_tokens += record.output_tokens
            summary.total_tokens += record.total_tokens
            summary.estimated_cost_usd += record.cost_usd
            total_duration += record.duration_ms

            if record.cache_hit:
                cache_hits += 1

            provider = record.provider
            if provider not in summary.by_provider:
                summary.by_provider[provider] = 0
            summary.by_provider[provider] += 1

            model = record.model
            if model not in summary.by_model:
                summary.by_model[model] = 0
            summary.by_model[model] += 1

            file_type = record.file_type
            if file_type not in summary.by_file_type:
                summary.by_file_type[file_type] = 0
            summary.by_file_type[file_type] += 1

        if summary.total_generations > 0:
            summary.avg_generation_time_ms = round(
                total_duration / summary.total_generations, 2
            )
            summary.cache_hit_rate = round(
                cache_hits / summary.total_generations * 100, 1
            )
            summary.estimated_cost_usd = round(summary.estimated_cost_usd, 6)

        return summary

    def clear_records(self):
        """Clear all recorded generations."""
        self._records.clear()

    @property
    def is_enabled(self) -> bool:
        """Check if LangFuse is enabled."""
        return self._enabled


_tracker: Optional[LangFuseTokenTracker] = None


def get_token_tracker() -> LangFuseTokenTracker:
    """Get or create token tracker singleton."""
    global _tracker
    if _tracker is None:
        _tracker = LangFuseTokenTracker()
    return _tracker
