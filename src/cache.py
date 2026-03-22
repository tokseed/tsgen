"""
Cache module for TypeScript Code Generator.
Provides in-memory caching for generated code.
"""

import json
import time
import hashlib
from typing import Optional, Dict, Any
from collections import OrderedDict
from pathlib import Path

MAX_CACHE_SIZE = 1000
CACHE_TTL = 3600


class CacheEntry:
    """Single cache entry with TTL support."""

    def __init__(self, key: str, value: str, ttl: int = CACHE_TTL):
        self.key = key
        self.value = value
        self.created_at = time.time()
        self.ttl = ttl
        self.hits = 0

    def is_expired(self) -> bool:
        """Check if entry has expired."""
        return time.time() - self.created_at > self.ttl

    def access(self):
        """Record access and return value."""
        self.hits += 1
        return self.value


class CacheManager:
    """In-memory LRU cache with TTL."""

    def __init__(self, max_size: int = MAX_CACHE_SIZE, ttl: int = CACHE_TTL):
        self.max_size = max_size
        self.ttl = ttl
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._stats = {
            "hits": 0,
            "misses": 0,
            "total_size_mb": 0,
            "hit_rate": 0,
        }

    def get(self, key: str) -> Optional[str]:
        """Get value from cache."""
        entry = self._cache.get(key)
        if entry is None:
            self._stats["misses"] += 1
            self._update_hit_rate()
            return None

        if entry.is_expired():
            del self._cache[key]
            self._stats["misses"] += 1
            self._update_hit_rate()
            return None

        self._cache.move_to_end(key)
        value = entry.access()
        self._stats["hits"] += 1
        self._update_hit_rate()
        return value

    def set(self, key: str, value: str) -> None:
        """Set value in cache."""
        if key in self._cache:
            self._cache.move_to_end(key)
            self._cache[key].value = value
            self._cache[key].created_at = time.time()
        else:
            if len(self._cache) >= self.max_size:
                self._cache.popitem(last=False)
            self._cache[key] = CacheEntry(key, value, self.ttl)
        self._update_stats()

    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if key in self._cache:
            del self._cache[key]
            self._update_stats()
            return True
        return False

    def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()
        self._stats = {
            "hits": 0,
            "misses": 0,
            "total_size_mb": 0,
            "hit_rate": 0,
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        self._update_stats()
        return {
            "enabled": True,
            **self._stats,
            "size": len(self._cache),
            "max_size": self.max_size,
        }

    def _update_hit_rate(self) -> None:
        """Calculate hit rate."""
        total = self._stats["hits"] + self._stats["misses"]
        if total > 0:
            self._stats["hit_rate"] = round(self._stats["hits"] / total * 100, 1)

    def _update_stats(self) -> None:
        """Update cache statistics."""
        total_size = sum(
            len(entry.key) + len(entry.value) for entry in self._cache.values()
        )
        self._stats["total_size_mb"] = round(total_size / (1024 * 1024), 3)


_cache_manager: Optional[CacheManager] = None


def get_cache_manager() -> Optional[CacheManager]:
    """Get or create cache manager singleton."""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager


def clear_cache() -> None:
    """Clear the cache."""
    manager = get_cache_manager()
    if manager:
        manager.clear()
